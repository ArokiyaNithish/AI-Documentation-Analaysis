// api/client.js — Axios instance configured for DocAnalyse AI backend
import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY || 'your_super_secret_api_key_here';

const client = axios.create({
  baseURL: '',     // Uses Vite dev proxy → http://localhost:8000
  timeout: 120000, // 2 min for large document processing
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// Response interceptor for unified error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.detail || error.message || 'Unknown error';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export const analyzeDocument = async ({ fileName, fileType, fileBase64 }) => {
  const { data } = await client.post('/api/document-analyze', {
    fileName,
    fileType,
    fileBase64,
  });
  return data;
};

export const chatWithDocument = async ({ question, documentId, history = [] }) => {
  const { data } = await client.post('/api/chat', {
    question,
    document_id: documentId,
    history,
  });
  return data;
};

export const checkHealth = async () => {
  const { data } = await client.get('/health');
  return data;
};

export default client;
