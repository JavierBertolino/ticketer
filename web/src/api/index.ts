import axios from 'axios';
import { Ticket } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

// Function to get assistants from the Express server
const getAssistants = async () => {
  try {
    const response = await axios.get(`${API_URL}/assistants`, {
      headers: {
        "x-api-key": import.meta.env.VITE_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching assistants:', error);
    throw error;
  }
};

// Function to add a new ticket (assistant) to the Express server
const addTicket = async (ticketData: Ticket) => {
  try {
    const response = await axios.post(`${API_URL}/tickets`, ticketData, {
      headers: {
        "content-type": "application/json",
        "x-api-key": import.meta.env.VITE_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error adding ticket:', error);
    throw error;
  }
};

const patchTicket = async (ticketData: Ticket) => {
  try {
    const { codigoEntrada, escaneado, usado } = ticketData;
    const response = await axios.patch(`${API_URL}/tickets/${codigoEntrada}`, { scanned: escaneado, usado }, {
      headers: {
        "content-type": "application/json",
        "x-api-key": import.meta.env.VITE_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error patching ticket:', error);
    throw error;
  }
}

const loginUser = async (usuario: string, password: string) => {
  console.log("Logging in with API key", import.meta.env.VITE_API_KEY);
  try {
    const response = await axios.post(`${API_URL}/login`, { usuario, password }, {
      headers: {
        "content-type": "application/json",
        "x-api-key": import.meta.env.VITE_API_KEY
      }
    });

    // Set the token as a cookie in the client-side
    document.cookie = `auth_token=${response.data.token}; path=/; secure=true; httponly=false`;

    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};


export { getAssistants, addTicket, loginUser, patchTicket };