// src/pages/LiveScoreboard.js
import React, { useState, useEffect, useRef } from 'react';
import competenciaService from '../services/competenciaService';

const WS_URL_BASE = `ws://localhost:8001/ws/competencia/`; 

const LiveScoreboard = () => {
  const [competencias, setCompetencias] = useState([]);
  const [selectedCompetencia, setSelectedCompetencia] = useState('');
  const [scores, setScores] = useState({}); // {inscripcion_id: {deportista, puntaje, arma}}
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const wsRef = useRef(null); // Referencia para el WebSocket
  // NOTA: Asegúrate de que tu servidor Daphne esté en el puerto 8001

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

      // ¡CAMBIO CLAVE! OBTENER TOKEN
      const token = localStorage.getItem('access_token');
      if (!token) {
          setConnectionStatus('Error: No autenticado');
          return; // No intentar conectar si no hay token
      }

      // ¡CAMBIO CLAVE! Añadimos el token a la URL como un query parameter
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
        
        // 2. Actualizar el estado de puntajes en tiempo real
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
  }, [selectedCompetencia]); // <-- Este efecto se ejecuta cuando 'selectedCompetencia' cambia


  const fetchCompetencias = async () => {
    try {
      // Usa getCompetencias para obtener la lista de competencias activas
      const res = await competenciaService.getCompetencias();
      setCompetencias(res.data.filter(comp => comp.status !== 'Finalizada'));
    } catch (err) {
      console.error("Error al obtener competencias:", err);
    }
  };

  const sortedScores = Object.values(scores).sort((a, b) => b.puntaje - a.puntaje);

  return (
    <div>
      <h2>Marcador en Vivo (Live Scoring)</h2>
      <p>Estado de la Conexión: <span style={{ color: connectionStatus === 'Conectado' ? 'green' : 'red' }}>{connectionStatus}</span></p>

      <label>Seleccionar Competencia:</label>
      <select onChange={(e) => setSelectedCompetencia(e.target.value)} value={selectedCompetencia}>
        <option value="">-- Seleccione --</option>
        {competencias.map(comp => (
          <option key={comp.id} value={comp.id}>{comp.name}</option>
        ))}
      </select>

      {selectedCompetencia && (
        <table>
          <thead>
            <tr>
              <th>Posición</th>
              <th>Deportista</th>
              <th>Arma</th>
              <th>Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.map((score, index) => (
              // Se usa index como key temporal si inscripcion_id no está
              <tr key={score.inscripcion_id || index}>
                <td>{index + 1}</td>
                <td>{score.deportista}</td>
                <td>{score.arma}</td>
                <td><strong>{score.puntaje}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LiveScoreboard;