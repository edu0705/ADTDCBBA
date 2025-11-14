// src/constants/roles.js

// Definimos los roles en un solo lugar.
export const ROLES = {
  PRESIDENTE: 'Presidente',
  TESORERO: 'Tesorero',
  CLUB: 'Club',
  JUEZ: 'Juez',
  DEPORTISTA: 'Deportista',
};

// También podemos exportar un array con los roles de Admin
export const ADMIN_ROLES = [ROLES.PRESIDENTE, ROLES.TESORERO];