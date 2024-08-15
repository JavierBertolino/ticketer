import React from 'react';
import { Button, Input, Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api';

interface LoginProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleLogin = async (values: { usuario: string; password: string }) => {
    try {
      const { usuario, password } = values;
      const response = await loginUser(usuario, password);
      message.success('Login successful');
      setIsAuthenticated(true);

      // Store the token in a cookie
      document.cookie = `token=${response.token}; path=/`;

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
      backgroundColor: '#f0f2f5' // Optional: to make it look better
    }}>
      <Form
        form={form}
        layout="vertical"
        style={{
          width: '300px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '4px',
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
          <Input />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Ingresa la contraseña!' }]}
        >
          <Input.Password />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          Login
        </Button>
      </Form>
    </div>
  );
};

export default Login;
