import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, error => Promise.reject(error));

// CRUD
const getAllDeportistas = () => api.get('deportistas/deportistas/');
const createDeportista = (data) => api.post('deportistas/deportistas/', data);
const getDeportistaById = (id) => api.get(`deportistas/deportistas/${id}/`);
const updateDeportista = (id, data) => api.patch(`deportistas/deportistas/${id}/`, data);

// Documentos y Armas
const uploadDocument = (formData) => api.post('deportistas/documentos/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const registerArma = (formData) => api.post('deportistas/armas/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const deleteArma = (id) => api.delete(`deportistas/armas/${id}/`);
const searchArmas = (query) => api.get(`deportistas/armas/?search=${query}`);

// Préstamos
const createLoan = (data) => api.post('deportistas/prestamos/', data);
const getLoanReport = (id) => api.get(`deportistas/prestamos/${id}/print_report/`, { responseType: 'blob' });
const downloadLoanReport = async (id) => {
    try {
        const response = await getLoanReport(id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Prestamo_${id}.pdf`);
        document.body.appendChild(link); link.click();
    } catch (e) { console.error(e); }
};

// Carnet
const getCarnet = (id) => api.get(`deportistas/deportistas/${id}/print_carnet/`, { responseType: 'blob' });
const downloadCarnet = async (id, n) => {
    try {
        const response = await getCarnet(id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Carnet_${n}.pdf`);
        document.body.appendChild(link); link.click();
    } catch (e) { console.error(e); alert("Error carnet"); }
};

// --- ESTADÍSTICAS Y CV ---
const getStats = (id = null) => {
    const endpoint = id ? `deportistas/stats/${id}/` : `deportistas/stats/me/`;
    return api.get(endpoint);
};

const downloadCV = async (id) => {
    try {
        const endpoint = id ? `deportistas/cv/${id}/` : `deportistas/cv/0/`; // Si id es null, backend usa 'me' si ajustamos la vista, o pasamos ID explícito
        const response = await api.get(endpoint, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `CV_Deportivo.pdf`);
        document.body.appendChild(link); link.click();
    } catch (e) { console.error(e); alert("Error descargando CV"); }
};

const deportistaService = {
    getAllDeportistas, createDeportista, getDeportistaById, updateDeportista,
    uploadDocument, registerArma, deleteArma, searchArmas,
    createLoan, downloadLoanReport, downloadCarnet,
    getStats, downloadCV, // Exportados
    api
};

export default deportistaService;