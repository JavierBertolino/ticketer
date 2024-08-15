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

      // Calculate the expiration date (3 hours from now)
      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + (3 * 60 * 60 * 1000)); // 3 hours in milliseconds

      // Store the token in a cookie with a 3-hour expiration
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
      padding: '10px', // Added padding to make the container adjust better on small screens
      backgroundColor: '#f0f2f5' // Optional: to make it look better
    }}>
      <Form
        form={form}
        layout="vertical"
        style={{
          width: '100%',
          // maxWidth: '430px', // Increased width for better usability on tablets
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fff', // Optional: better form appearance
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' // Optional: subtle shadow
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
