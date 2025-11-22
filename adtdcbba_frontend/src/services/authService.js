import axios from 'axios';

// CORRECCIÓN: Usar la variable de entorno o el localhost por defecto.
// Nota: Se agrega '/api/' al final porque tus rutas en urls.py empiezan con 'api/'
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptador para añadir el token de autenticación en cada solicitud
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const registerClub = (userData) => {
  return api.post('clubs/register/', userData); // Asegúrate de que esta ruta coincida con tu urls.py
};

const login = (username, password) => {
  // Petición al endpoint de token
  return api.post('token/', {
    username,
    password,
  });
};

const AuthService = {
  registerClub,
  login,
  api
};

export default AuthService;