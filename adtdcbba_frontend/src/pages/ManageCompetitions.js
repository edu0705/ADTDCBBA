import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import competenciaService from '../services/competenciaService';
import { FaPlus, FaCalendarAlt, FaLock, FaCheckCircle, FaEdit, FaSearch } from 'react-icons/fa'; // <-- FaTrophy ELIMINADO

const ManageCompetitions = () => {
  const [competencias, setCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await competenciaService.getCompetencias();
      setCompetencias(res.data.results || res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleClose = async (id, name) => {
      if(window.confirm(`¿Estás seguro de FINALIZAR la competencia "${name}"?\n\nEsto congelará los puntajes y habilitará los Rankings Oficiales.`)) {
          try {
              await competenciaService.api.post(`competencias/${id}/close_competition/`);
              alert("Competencia finalizada correctamente.");
              loadData();
          } catch (err) { alert("Error al cerrar competencia."); }
      }
  };

  const filtered = competencias.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

  if (loading) return <div className="text-center p-5">Cargando eventos...</div>;

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Gestión de Competencias</h2>
        <Link to="/admin/competencias/crear" className="btn btn-primary rounded-pill px-4 shadow-sm">
            <FaPlus className="me-2"/> Nueva Competencia
        </Link>
      </div>

      {/* Buscador */}
      <div className="card-elegant mb-4 p-3">
          <div className="input-group border-0 bg-light rounded-pill overflow-hidden">
              <span className="input-group-text border-0 bg-transparent ps-3"><FaSearch className="text-muted"/></span>
              <input type="text" className="form-control border-0 bg-transparent" placeholder="Buscar competencia..." value={filter} onChange={e=>setFilter(e.target.value)}/>
          </div>
      </div>

      <div className="row">
          {filtered.map(comp => (
              <div key={comp.id} className="col-md-6 col-xl-4 mb-4">
                  <div className={`card h-100 border-0 shadow-sm rounded-4 overflow-hidden ${comp.status === 'Finalizada' ? 'opacity-75' : ''}`}>
                      <div className={`card-header border-0 py-3 px-4 d-flex justify-content-between align-items-center ${comp.status === 'Próxima' ? 'bg-primary text-white' : comp.status === 'En Progreso' ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                          <span className="fw-bold small text-uppercase letter-spacing-1">{comp.type}</span>
                          <span className="badge bg-white text-dark bg-opacity-75 rounded-pill">{comp.status}</span>
                      </div>
                      <div className="card-body p-4">
                          <h5 className="fw-bold text-dark mb-2">{comp.name}</h5>
                          <div className="text-muted small mb-3">
                              <FaCalendarAlt className="me-2"/> {comp.start_date} al {comp.end_date}
                          </div>
                          
                          <hr className="opacity-10"/>
                          
                          <div className="d-flex justify-content-between align-items-center mt-3">
                              {/* Botones de Acción */}
                              {comp.status !== 'Finalizada' ? (
                                  <div className="d-flex gap-2 w-100">
                                      <button className="btn btn-outline-secondary btn-sm rounded-pill flex-grow-1" title="Editar (Próximamente)">
                                          <FaEdit/> Editar
                                      </button>
                                      <button 
                                        className="btn btn-danger btn-sm rounded-pill flex-grow-1 fw-bold" 
                                        onClick={() => handleClose(comp.id, comp.name)}
                                      >
                                          <FaLock className="me-1"/> Cerrar Evento
                                      </button>
                                  </div>
                              ) : (
                                  <div className="text-center w-100 text-success fw-bold small">
                                      <FaCheckCircle className="me-1"/> Resultados Oficiales
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          ))}
          {filtered.length === 0 && <div className="col-12 text-center p-5 text-muted">No se encontraron competencias.</div>}
      </div>
    </div>
  );
};

export default ManageCompetitions;