import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { Button, Input, Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api';

interface LoginProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      navigate('/home');
    }
  }, []);

  const handleLogin = async (values: { usuario: string; password: string }) => {
    try {
      const { usuario, password } = values;
      const response = await loginUser(usuario, password);
      message.success('Login successful');
      setIsAuthenticated(true);

      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + (3 * 60 * 60 * 1000)); // 3 hours in milliseconds

      document.cookie = `token=${response.token}; path=/; expires=${expirationDate.toUTCString()}`;

      navigate('/home');
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      padding: '10px',
      backgroundColor: '#f0f2f5'
    }}>
      <Form
        form={form}
        layout="vertical"
        style={{
          width: '100%',
          maxWidth: '375px', // Adjusted for mobile screens
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}
        onFinish={handleLogin}
      >
        <Form.Item
          label="Usuario"
          name="usuario"
          rules={[{ required: true, message: 'Ingresa el nombre de usuario' }]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Ingresa la contraseña!' }]}
        >
          <Input.Password size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Login
        </Button>
      </Form>
    </div>
  );
};

export default Login;
