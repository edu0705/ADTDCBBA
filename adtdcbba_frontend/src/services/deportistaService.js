// src/services/deportistaService.js
import authService from './authService';

const deportistaService = {
  // Obtiene todos los deportistas
  getDeportistas: () => authService.api.get('deportistas/deportistas/'),
  
  // Crea un nuevo deportista
  createDeportista: (data) => authService.api.post('deportistas/register/', data),
  
  // Obtiene el detalle de un deportista (para el Admin)
  getDeportistaDetail: (id) => authService.api.get(`deportistas/deportistas/${id}/`),
  
  // Para RECHAZAR (cambia estado y añade notas)
  updateDeportista: (id, data) => authService.api.patch(`deportistas/deportistas/${id}/`, data),

  // Para APROBAR (crea el usuario)
  approveDeportista: (id) => authService.api.post(`deportistas/deportistas/${id}/approve/`),

  // Para SUSPENDER (cambia estado y desactiva el usuario)
  suspendDeportista: (id) => authService.api.post(`deportistas/deportistas/${id}/suspend/`),
  
  // Para REACTIVAR (cambia estado y activa el usuario)
  reactivateDeportista: (id) => authService.api.post(`deportistas/deportistas/${id}/reactivate/`),
  
  // ¡NUEVA FUNCIÓN AÑADIDA!
  // Para que el deportista obtenga su propio perfil
  getMiPerfil: () => authService.api.get('deportistas/mi-perfil/'),
};

export default deportistaService;