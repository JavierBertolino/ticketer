import React from 'react';
import { Button, Input, Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';  // Import useNavigate hook
import { loginUser } from '../api';

interface LoginProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();  // Initialize the useNavigate hook

  const handleLogin = async (values: { usuario: string; password: string }) => {
    try {
      const { usuario, password } = values;
      await loginUser(usuario, password);
      message.success('Login successful');
      setIsAuthenticated(true);  // Set isAuthenticated to true after successful login
      navigate('/home');  // Programmatically navigate to /home
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Form
        form={form}
        layout="vertical"
        style={{ width: '300px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}
        onFinish={handleLogin}
      >
        <Form.Item
          label="usuario"
          name="usuario"
          rules={[{ required: true, message: 'Please input your usuario!' }]}
        >
          <Input type="usuario" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
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
