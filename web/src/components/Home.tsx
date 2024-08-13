import React, { useRef, useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Form, Result } from 'antd';
import QrScanner from 'qr-scanner';
import Webcam from 'react-webcam';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getAssistants, addTicket } from '../api';
import { Ticket } from '../types';

const { Column } = Table;

const Home: React.FC = () => {
  const [asistentes, setAsistentes] = useState<Ticket[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchAssistants = async () => {
      const assistants = await getAssistants();
      setAsistentes(assistants);
    };
    fetchAssistants();
  }, []);

  useEffect(() => {
    if (isScannerVisible && webcamRef.current?.video) {
      const qrScanner = new QrScanner(
        webcamRef.current.video,
        (result) => handleScan(result),
        {
          onDecodeError: handleError,
        }
      );
      setScanner(qrScanner);

      qrScanner.start()
        .then(() => {
          console.log('Scanner started successfully');
        })
        .catch(err => {
          console.error('Failed to start scanner', err);
        });
    }
  }, [isScannerVisible]);

  const startScan = () => {
    setScannerVisible(true);
  };

  const stopScan = () => {
    if (scanner) {
      scanner.stop();
      setScannerVisible(false);
      setScanner(null);
    }
  };

  const createTicket = async (values: { nombre: string; mail: string; cel: string }) => {
    const { nombre, mail, cel } = values;

    const codigoEntrada = uuidv4();
    const fechaDeCompra = dayjs().format('DD-MM-YYYY');
    const newTicket: Ticket = {
      id: uuidv4(),
      nombre,
      mail,
      cel,
      codigoEntrada,
      fechaDeCompra,
      usado: false,
      escaneado: ''
    };

    setAsistentes([...asistentes, newTicket]);
    form.resetFields();
    setIsModalVisible(false);
    await addTicket(newTicket);
  };

  const handleScan = (result: QrScanner.ScanResult) => {
    console.log('Scan result:', result);
    const scannedData = JSON.parse(result.data);
    const assistant = asistentes.find((p) => p.codigoEntrada === scannedData.codigoEntrada);

    if (assistant) {
      if (!assistant.usado) {
        setAsistentes(
          asistentes.map((p) =>
            p.codigoEntrada === scannedData.codigoEntrada ? { ...p, usado: true, escaneado: dayjs().format('DD-MM-YYYY HH:mm:ss') } : p
          )
        );
        setScanResult("success");
      } else {
        setScanResult("error");
      }
    } else {
      setScanResult("error");
    }
    stopScan();  // Stop the scanner after processing the result
  };

  const handleError = (err: any) => {
    console.error('QR Code scan error:', err);
  };

  const videoConstraints = {
    facingMode: 'environment', // Use the rear camera
  };

  const FullScreenQRCodeScanner: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <button onClick={onClose} style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer'
      }}>✖</button>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>Party Ticket Generator</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Button type="primary" onClick={() => setIsModalVisible(true)} style={{ margin: '5px', width: "100px", height: "100px", textWrap: "wrap" }}>
          Crear Ticket
        </Button>
        <Button type="primary" onClick={startScan} style={{ margin: '5px', width: "100px", height: "100px", textWrap: "wrap" }}>
          Escanear Código QR
        </Button>
      </div>
      {scanResult && (
        <Result
          status={scanResult}
          title={scanResult === "success" ? "QR Code Scanned Successfully!" : "Failed to Scan QR Code"}
          extra={[
            <Button type="primary" key="continue" onClick={() => setScanResult(null)} >
              Volver a Escanear
            </Button>
          ]}
        />
      )}

      {!scanResult && (
        <Table dataSource={asistentes} rowKey="id" style={{ width: '100%', maxWidth: '800px' }}>
          <Column title="Nombre" dataIndex="nombre" key="nombre" />
          <Column title="Mail" dataIndex="mail" key="mail" />
          <Column title="Cel" dataIndex="cel" key="cel" />
          <Column title="Codigo Entrada" dataIndex="codigoEntrada" key="codigoEntrada" />
          <Column title="Fecha de Compra" dataIndex="fechaDeCompra" key="fechaDeCompra" />
          <Column title="Usado" dataIndex="usado" key="usado" render={(_, record: Ticket) => (record.usado ? 'Si' : 'No')} />
        </Table>
      )}

      <Modal
        title="Agregar Ticket"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={createTicket}
        >
          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[{ required: true, message: 'Please input the name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Mail"
            name="mail"
            rules={[{ required: true, message: 'Please input the email!' }]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item
            label="Cel"
            name="cel"
            rules={[{ required: true, message: 'Please input the phone number!' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {isScannerVisible && (
        <FullScreenQRCodeScanner
          onClose={stopScan}
        />
      )}
    </div>
  );
};

export default Home;
