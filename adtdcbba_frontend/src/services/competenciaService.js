import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, error => Promise.reject(error));

// Gestión
const getCompetencias = () => api.get('competencias/');
const getModalidades = () => api.get('modalidades/');
const getInscripciones = () => api.get('inscripciones/');
const submitScore = (data) => api.post('score/submit/', data);
const getGastos = () => api.get('gastos/');
const createGasto = (data) => api.post('gastos/', data);
const deleteGasto = (id) => api.delete(`gastos/${id}/`);

// NUEVO: Estadísticas de Quórum y Borrado de Inscripción
const getCompetenciaStats = (id) => api.get(`competencias/${id}/stats/`);
const deleteInscripcion = (id) => api.delete(`inscripciones/${id}/`);

// Reportes
const getOfficialResults = (id) => api.get(`competencias/${id}/official_results/`);
const getAnnualRanking = (year) => api.get(`competencias/ranking/anual/?year=${year}`);
const getRecords = () => api.get('competencias/records/');
const getClubRanking = (year) => api.get(`competencias/ranking/clubes/?year=${year}`);

// Operaciones
const updateInscripcion = (id, data) => api.patch(`inscripciones/${id}/`, data);
const downloadReceipt = async (id) => {
    try {
        const response = await api.get(`inscripciones/${id}/print_receipt/`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Recibo_${id}.pdf`);
        document.body.appendChild(link); link.click();
    } catch (e) { console.error(e); alert("Error recibo."); }
};
const downloadDiploma = async (rid, nombre) => {
    try {
        const response = await api.get(`resultados/${rid}/print_diploma/`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Diploma_${nombre}.pdf`);
        document.body.appendChild(link); link.click();
    } catch (e) { console.error(e); alert("Error diploma."); }
};

const competenciaService = {
  getCompetencias, getModalidades, getInscripciones, submitScore,
  getOfficialResults, getAnnualRanking, getRecords, getClubRanking,
  getGastos, createGasto, deleteGasto, getCompetenciaStats, // <-- Nuevo
  updateInscripcion, deleteInscripcion, // <-- Nuevo
  downloadReceipt, downloadDiploma,
  api
};
export default competenciaService;