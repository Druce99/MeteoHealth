import axios from 'axios';

// Для физического устройства (iPhone) — укажи IP своей машины в .env:
// EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api/v1
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
