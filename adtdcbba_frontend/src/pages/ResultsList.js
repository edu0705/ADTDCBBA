// src/pages/ResultsList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import competenciaService from '../services/competenciaService';
import { FaTrophy, FaCalendarAlt, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

const ResultsList = () => {
  const [competencias, setCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComps = async () => {
      try {
        const res = await competenciaService.getCompetencias();
        const data = res.data.results || res.data;
        // Filtramos solo las FINALIZADAS (Resultados Oficiales)
        setCompetencias(data.filter(c => c.status === 'Finalizada')); 
      } catch (err) {
        console.error("Error cargando competencias", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComps();
  }, []);

  if (loading) return <div className="text-center p-5">Cargando campeonatos...</div>;

  return (
    <div className="container fade-in">
      <div className="mb-4">
        <h2 className="fw-bold text-dark">Resultados Oficiales</h2>
        <p className="text-muted">Selecciona un campeonato para ver los puntajes detallados.</p>
      </div>
      
      <div className="row">
        {competencias.length === 0 ? (
             <div className="col-12">
                 <div className="alert alert-light text-center shadow-sm rounded-4 p-5">
                    <FaTrophy className="text-muted mb-3" size={40} opacity={0.3} />
                    <h5>No hay campeonatos finalizados aún.</h5>
                 </div>
             </div>
        ) : (
            competencias.map(comp => (
              <div key={comp.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card-elegant h-100 border-0 shadow-sm hover-scale">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between mb-3">
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 d-flex align-items-center gap-2">
                            <FaCheckCircle size={12}/> Finalizada
                        </span>
                        <small className="text-muted fw-bold">{comp.type}</small>
                    </div>
                    
                    <h4 className="fw-bold mb-2 text-dark">{comp.name}</h4>
                    
                    <div className="d-flex align-items-center text-muted small mb-4">
                        <FaCalendarAlt className="me-2 text-primary"/>
                        {comp.start_date}
                    </div>
                    
                    <Link to={`/admin/resultados/${comp.id}`} className="btn btn-outline-primary w-100 rounded-pill fw-bold">
                        Ver Resultados <FaArrowRight className="ms-2"/>
                    </Link>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ResultsList;