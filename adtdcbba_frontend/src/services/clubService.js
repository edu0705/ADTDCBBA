// src/services/clubService.js
import authService from './authService';

// Servicio dedicado a la gestión de Clubes (para el Admin)
const clubService = {
  // Obtiene la lista de todos los clubes (para el reporte maestro)
  getClubs: () => authService.api.get('clubs/'),
  
  // (Aquí podríamos añadir createClub, updateClub, deleteClub si el admin pudiera editarlos)
};

export default clubService;