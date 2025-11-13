// src/pages/ManageArmas.js
import React, { useState, useEffect } from 'react';
import armaService from '../services/armaService'; // Ya teníamos este servicio
import deportistaService from '../services/deportistaService'; // Para buscar deportistas

const ManageArmas = () => {
  const [armas, setArmas] = useState([]);
  const [deportistas, setDeportistas] = useState([]); // Para mapear ID a Nombre
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Obtenemos ambas listas en paralelo
      const [armasRes, deportistasRes] = await Promise.all([
        armaService.getArmas(),
        deportistaService.getDeportistas()
      ]);

      // Extraemos los datos paginados
      const extractData = (res) => (res.data && res.data.results) ? res.data.results : res.data;

      setArmas(extractData(armasRes));
      setDeportistas(extractData(deportistasRes));
      setError('');
    } catch (err) {
      console.error("Error al cargar datos:", err.response || err);
      setError("No se pudo cargar el reporte de armas.");
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar el nombre del deportista usando el ID del arma
  const getDeportistaName = (deportistaId) => {
    const deportista = deportistas.find(d => d.id === deportistaId);
    return deportista ? `${deportista.first_name} ${deportista.apellido_paterno}` : `ID: ${deportistaId}`;
  };

  if (loading) {
    return <div className="container mt-4">Cargando reporte de armas...</div>;
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="text-primary mb-4">Reporte Maestro de Armas</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm">
        <div className="card-header">
          <h4 className="mb-0 text-dark">Todas las Armas Registradas</h4>
        </div>
        <div className="card-body">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Propietario (Deportista)</th>
                <th>Tipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Calibre</th>
                <th>N° Matrícula</th>
              </tr>
            </thead>
            <tbody>
              {armas.map(arma => (
                <tr key={arma.id}>
                  <td>{getDeportistaName(arma.deportista)}</td>
                  <td>{arma.tipo}</td>
                  <td>{arma.marca}</td>
                  <td>{arma.modelo}</td>
                  <td>{arma.calibre}</td>
                  <td><strong>{arma.numero_matricula}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageArmas;