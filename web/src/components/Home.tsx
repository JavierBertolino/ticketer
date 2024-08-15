import React, { useRef, useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Form, Result, Select } from 'antd';
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
  const scannerRef = useRef<QrScanner | null>(null); // Use ref instead of state for the scanner
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "error" | "warning" | null>(null);
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
      console.log("setting scanner", qrScanner);
      scannerRef.current = qrScanner; // Assign the scanner to the ref

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
    console.log("about to stop it", scannerRef.current);
    if (scannerRef.current) {
      console.log("stopping scanner", scannerRef.current);
      try {
        scannerRef.current.stop();
        console.log("scanner stopped");
        scannerRef.current = null; // Reset the ref
        setScannerVisible(false);
      } catch (err: any) {
        console.error('Error stopping scanner', err);
      }
    }
  };

  const createTicket = async (values: { nombre: string; mail: string; cel: string, type: string }) => {
    const { nombre, mail, cel, type } = values;

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
      type,
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

    console.log("assistant", assistant);
    if (assistant) {
      if (!assistant.usado) {
        // here check if the current time is after 1:30AM
        if (assistant.type === "FreeMujeres" && dayjs().isAfter(dayjs().hour(1).minute(30))) {
          setScanResult("warning");
          return;
        }
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

    // Stop the scanner after processing the result
    stopScan();

    // Automatically hide the result after 10 seconds
    setTimeout(() => {
      setScanResult(null);
    }, 10000);
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
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        zIndex: 1001
      }}>✖</button>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        style={{ width: '100%', height: '100%', backgroundColor: 'black' }}
      />
    </div>
  );

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: "center" }}>
      <h1>Tickets Manager</h1>

      {scanResult && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          width: '300px',
          background: 'white',
          padding: '20px',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          textAlign: 'center'
        }}>
          <Result
            status={scanResult}
            title={scanResult === "success" ? "Entrada valida!" : "Entrada invalida"}
            extra={[
              <Button key="close" onClick={() => setScanResult(null)}>Cerrar</Button>,
            ]}
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Button type="primary" onClick={() => setIsModalVisible(true)} style={{ margin: '5px', width: "100px", height: "100px", textWrap: "wrap" }}>
          Crear Ticket
        </Button>
        <Button type="primary" onClick={startScan} style={{ margin: '5px', width: "100px", height: "100px", textWrap: "wrap" }}>
          Escanear Código QR
        </Button>
      </div>

      <Table dataSource={asistentes} rowKey="id" style={{ width: '100%', maxWidth: '800px' }}>
        <Column title="Nombre" dataIndex="nombre" key="nombre" />
        <Column title="Codigo Entrada" dataIndex="codigoEntrada" key="codigoEntrada" />
        <Column title="Usado" dataIndex="usado" key="usado" render={(_, record: Ticket) => (record.usado ? 'Si' : 'No')} />
        <Column title="Tipo" dataIndex="type" key="type" />
        <Column title="Mail" dataIndex="mail" key="mail" />
        <Column title="Cel" dataIndex="cel" key="cel" />
        <Column title="Fecha de Compra" dataIndex="fechaDeCompra" key="fechaDeCompra" />
      </Table>

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
            rules={[{ required: true, message: 'Ingresa un nombre!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Mail"
            name="mail"
            rules={[{ required: true, message: 'Ingresa un mail' }]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item
            label="Telefono"
            name="cel"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Tipo"
            name="type"
          >
            <Select defaultValue="General">
              <Select.Option value="General">General</Select.Option>
              <Select.Option value="FreeMujeres">Free Mujeres</Select.Option>
            </Select>
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
