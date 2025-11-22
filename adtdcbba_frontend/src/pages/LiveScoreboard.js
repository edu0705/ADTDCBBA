import React, { useState, useEffect, useRef } from 'react';
import competenciaService from '../services/competenciaService';

// --- LÓGICA DINÁMICA DE WEBSOCKET ---
// Detecta si la página se sirve por HTTPS o HTTP para elegir wss: o ws:
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

// Detecta el host del backend.
// En desarrollo suele ser localhost:8001. En producción, usa la variable de entorno.
const API_HOST = process.env.REACT_APP_API_HOST || 'localhost:8001'; 

// Construye la URL base final
const WS_URL_BASE = `${protocol}//${API_HOST}/ws/competencia/`;

const LiveScoreboard = () => {
  const [competencias, setCompetencias] = useState([]);
  const [selectedCompetencia, setSelectedCompetencia] = useState('');
  const [scores, setScores] = useState({}); // {inscripcion_id: {deportista, puntaje, arma}}
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const wsRef = useRef(null); 

  useEffect(() => {
    fetchCompetencias();
  }, []);

  useEffect(() => {
    // Lógica de conexión/desconexión de WebSocket
    if (selectedCompetencia) {
      // 1. Cerrar conexión anterior si existe
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Verificación de Token (Seguridad)
      const token = localStorage.getItem('access_token');
      if (!token) {
          setConnectionStatus('Error: No autenticado');
          return;
      }

      // 2. Añadimos el token a la URL
      const WS_URL = `${WS_URL_BASE}${selectedCompetencia}/?token=${token}`;
      
      setConnectionStatus('Conectando...');
      console.log(`Intentando conectar a: ${WS_URL}`);
      
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('Conectado');
        console.log(`WebSocket conectado a competencia: ${selectedCompetencia}`);
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log("Puntaje recibido:", data);
        
        // 3. Actualizar el estado de puntajes en tiempo real
        setScores(prevScores => ({
          ...prevScores,
          [data.inscripcion_id]: {
            deportista: data.deportista,
            puntaje: data.puntaje,
            arma: data.arma
          }
        }));
      };

      ws.onclose = () => {
        setConnectionStatus('Desconectado');
        console.log("WebSocket cerrado.");
      };

      ws.onerror = (err) => {
        console.error("Error de WebSocket:", err);
        setConnectionStatus('Error de conexión');
      };

      // Cleanup: cerrar la conexión al desmontar o cambiar la competencia
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    }
  }, [selectedCompetencia]);


  const fetchCompetencias = async () => {
    try {
      const res = await competenciaService.getCompetencias();
      // Soporte para respuesta paginada o lista directa
      const data = (res.data && res.data.results) ? res.data.results : res.data;
      // Filtramos solo las que no están 'Finalizada'
      setCompetencias(data.filter(comp => comp.status !== 'Finalizada'));
    } catch (err) {
      console.error("Error al obtener competencias:", err);
    }
  };

  // Ordenamos los puntajes de mayor a menor
  const sortedScores = Object.values(scores).sort((a, b) => parseFloat(b.puntaje) - parseFloat(a.puntaje));

  return (
    <div>
      <h2>Marcador en Vivo (Live Scoring)</h2>
      <p>Estado de la Conexión: <span style={{ color: connectionStatus === 'Conectado' ? 'green' : 'red', fontWeight: 'bold' }}>{connectionStatus}</span></p>

      <label>Seleccionar Competencia:</label>
      <select className="form-select" onChange={(e) => setSelectedCompetencia(e.target.value)} value={selectedCompetencia}>
        <option value="">-- Seleccione --</option>
        {competencias.map(comp => (
          <option key={comp.id} value={comp.id}>{comp.name}</option>
        ))}
      </select>

      {selectedCompetencia && (
        <table className="table table-striped table-hover mt-4">
          <thead className="table-dark">
            <tr>
              <th>Posición</th>
              <th>Deportista</th>
              <th>Arma</th>
              <th>Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.map((score, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{score.deportista}</td>
                <td>{score.arma}</td>
                <td><strong>{score.puntaje}</strong></td>
              </tr>
            ))}
            {sortedScores.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-muted">Esperando puntajes...</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LiveScoreboard;