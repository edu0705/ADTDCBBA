import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/';
const API_URL = 'https://damagingly-ungroupable-madilynn.ngrok-free'; // <-- ¡PEGA LA URL DE TU BACKEND AQUÍ!
// Crea una instancia de Axios para la API de Django
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
  // Usa la instancia 'api'
  return api.post('register/club/', userData);
};

const login = (username, password) => {
  // Esta es la única petición que no necesita un token
  return api.post('token/', {
    username,
    password,
  });
};

// Asigna el objeto a una constante antes de exportarlo
const AuthService = {
  registerClub,
  login,
  api
};

export default AuthService;