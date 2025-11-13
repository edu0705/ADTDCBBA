// src/pages/ManageClubs.js
import React, { useState, useEffect } from 'react';
import clubService from '../services/clubService';

const ManageClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await clubService.getClubs();
      
      // Extraemos los datos de la respuesta paginada (si existe)
      const data = (response.data && response.data.results) 
                   ? response.data.results 
                   : response.data;
                   
      setClubs(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error("Error al cargar clubes:", err.response || err);
      setError("No se pudo cargar la lista de clubes.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mt-4">Cargando clubes...</div>;
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="text-primary mb-4">Reporte Maestro de Clubes</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm">
        <div className="card-header">
          <h4 className="mb-0 text-dark">Clubes Registrados en el Sistema</h4>
        </div>
        <div className="card-body">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre del Club</th>
                <th>Presidente</th>
                <th>N° Licencia</th>
                <th>Vencimiento Licencia</th>
                <th>ID de Usuario (Login)</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map(club => (
                <tr key={club.id}>
                  <td>{club.id}</td>
                  <td><strong>{club.name}</strong></td>
                  <td>{club.presidente_club}</td>
                  <td>{club.numero_licencia || 'N/A'}</td>
                  <td>{club.fecha_vencimiento_licencia || 'N/A'}</td>
                  <td>{club.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageClubs;