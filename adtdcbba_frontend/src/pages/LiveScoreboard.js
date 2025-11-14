import React, { useState, useEffect, useRef } from 'react';
import competenciaService from '../services/competenciaService';

// ¡CORREGIDO! Lee la URL del WebSocket desde las variables de entorno,
// con un fallback a localhost:8001 para desarrollo.
// const WS_URL_BASE = process.env.REACT_APP_WS_URL || `ws://localhost:8001/ws/competencia/`;
const WS_URL_BASE = 'wss://<URL-DEL-BACKEND-abc>.ngrok-free.app/ws/competencia/'; // <-- ¡PEGA LA URL DE TU BACKEND AQUÍ (con wss://)!
const LiveScoreboard = () => {
  const [competencias, setCompetencias] = useState([]);
  const [selectedCompetencia, setSelectedCompetencia] = useState('');
  const [scores, setScores] = useState({}); // {inscripcion_id: {deportista, puntaje, arma}}
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const wsRef = useRef(null); // Referencia para el WebSocket

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

      // ¡CORRECCIÓN! (Paso 4 de Seguridad)
      // Obtenemos el token para autenticar la conexión
      const token = localStorage.getItem('access_token');
      if (!token) {
          setConnectionStatus('Error: No autenticado');
          return; // No intentar conectar si no hay token
      }

      // 2. Añadimos el token a la URL como un query parameter
      const WS_URL = `${WS_URL_BASE}${selectedCompetencia}/?token=${token}`;
      
      setConnectionStatus('Conectando...');
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
        // Usamos el ID de inscripción como clave única
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
    // Este efecto se ejecuta cada vez que 'selectedCompetencia' cambia
  }, [selectedCompetencia]);


  const fetchCompetencias = async () => {
    try {
      // Usa getCompetencias para obtener la lista de competencias
      const res = await competenciaService.getCompetencias();
      // Leemos los 'results' de la respuesta paginada
      const data = (res.data && res.data.results) ? res.data.results : res.data;
      // Filtramos solo las que no están 'Finalizada'
      setCompetencias(data.filter(comp => comp.status !== 'Finalizada'));
    } catch (err) {
      console.error("Error al obtener competencias:", err);
    }
  };

  // Ordenamos los puntajes de mayor a menor para el ranking
  const sortedScores = Object.values(scores).sort((a, b) => b.puntaje - a.puntaje);

  return (
    <div>
      <h2>Marcador en Vivo (Live Scoring)</h2>
      <p>Estado de la Conexión: <span style={{ color: connectionStatus === 'Conectado' ? 'green' : 'red' }}>{connectionStatus}</span></p>

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
              <tr key={score.inscripcion_id || index}>
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