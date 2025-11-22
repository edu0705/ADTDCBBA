import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';
import { FaPrint } from 'react-icons/fa';
import logo from '../assets/logo.png'; // <--- IMPORTAR LOGO

const StartList = () => {
  const [competencias, setCompetencias] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [inscritos, setInscritos] = useState([]);

  useEffect(() => {
    const load = async () => {
        try {
            const res = await competenciaService.getCompetencias();
            // Solo competencias activas (No finalizadas)
            setCompetencias((res.data.results || res.data).filter(c => c.status !== 'Finalizada'));
        } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
      if (!selectedComp) return;
      const fetchInsc = async () => {
          try {
              const res = await competenciaService.getInscripciones();
              // Filtrar inscripciones APROBADAS para esta competencia
              const list = (res.data.results || res.data).filter(i => 
                  i.competencia === parseInt(selectedComp) && i.estado === 'APROBADA'
              );
              setInscritos(list);
          } catch (err) { console.error(err); }
      };
      fetchInsc();
  }, [selectedComp]);

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <h2 className="fw-bold text-dark">Planillas de Campo</h2>
          <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={()=>window.print()} disabled={!selectedComp}>
              <FaPrint className="me-2"/> Imprimir Lista
          </button>
      </div>

      <div className="card-elegant p-4 mb-4 no-print">
          <label className="fw-bold mb-2 text-primary">Seleccionar Competencia Activa:</label>
          <select className="form-select" value={selectedComp} onChange={e=>setSelectedComp(e.target.value)}>
              <option value="">-- Seleccione Evento --</option>
              {competencias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
      </div>

      {selectedComp && (
          <div className="bg-white p-5 shadow-sm printable-area">
              {/* ENCABEZADO CON LOGO */}
              <div className="d-flex align-items-center justify-content-center mb-5 border-bottom pb-4">
                  <img src={logo} alt="Logo" style={{width: '80px', height: '80px', objectFit: 'contain'}} className="me-4"/>
                  <div className="text-center">
                      <h3 className="fw-bold m-0 text-dark">ASOCIACIÓN DEPORTIVA DE TIRO</h3>
                      <h5 className="text-uppercase mt-2 text-primary letter-spacing-1">
                          {competencias.find(c=>c.id === parseInt(selectedComp))?.name}
                      </h5>
                      <p className="text-muted small m-0">PLANILLA DE CONTROL DE JUECES Y ASISTENCIA</p>
                  </div>
              </div>

              <table className="table table-bordered border-dark">
                  <thead className="table-light text-center align-middle">
                      <tr>
                          <th style={{width: '40px'}}>#</th>
                          <th>DEPORTISTA</th>
                          <th>CLUB</th>
                          <th>CATEGORÍAS / ARMAS</th>
                          <th style={{width: '120px'}}>FIRMA</th>
                          <th style={{width: '60px'}}>OK</th>
                      </tr>
                  </thead>
                  <tbody>
                      {inscritos.map((ins, idx) => (
                          <tr key={ins.id}>
                              <td className="text-center fw-bold align-middle">{idx + 1}</td>
                              <td className="align-middle">
                                  <span className="fw-bold d-block">{ins.deportista_nombre}</span>
                                  <span className="text-uppercase">{ins.deportista_apellido}</span>
                              </td>
                              <td className="align-middle small">{ins.club_nombre}</td>
                              <td className="small">
                                  {ins.participaciones.map((p, i) => (
                                      <div key={i} className="border-bottom py-1 last:border-0">
                                          <strong>{p.modalidad_name}</strong> {p.categoria_name ? `- ${p.categoria_name}` : ''}
                                          <br/>
                                          <span className="text-muted fst-italic">{p.arma_info || '(Sin Arma)'}</span>
                                      </div>
                                  ))}
                              </td>
                              <td></td>
                              <td></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              
              <div className="mt-5 pt-5 d-flex justify-content-around text-center">
                  <div className="px-5">
                      <div className="border-top border-dark pt-2 fw-bold" style={{width: '200px'}}>Juez Principal</div>
                  </div>
                  <div className="px-5">
                      <div className="border-top border-dark pt-2 fw-bold" style={{width: '200px'}}>Director de Tiro</div>
                  </div>
              </div>
              
              <div className="text-center mt-5 pt-4 text-muted small opacity-50">
                  Generado por Sistema ADTDCBBA - {new Date().toLocaleDateString()}
              </div>
          </div>
      )}
    </div>
  );
};

export default StartList;