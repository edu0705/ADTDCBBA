import React, { useState, useEffect } from 'react';
import authService from '../services/authService'; // Usamos authService para llamar a la API
import { FaTrophy, FaHistory, FaArrowUp, FaCrown } from 'react-icons/fa';

const RecordsView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        // Usamos la instancia 'api' de authService o competenciaService
        const res = await authService.api.get('competencias/records/');
        setRecords(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  if (loading) return <div className="p-5 text-center">Cargando Salón de la Fama...</div>;

  return (
    <div className="container fade-in pb-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold text-dark text-uppercase letter-spacing-1">
            <FaCrown className="text-warning me-2 mb-1"/> Récords Departamentales
        </h2>
        <p className="text-muted">Máximos puntajes históricos registrados oficialmente.</p>
      </div>

      <div className="row">
        {records.map((rec, idx) => (
          <div key={idx} className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm h-100 overflow-hidden" style={{borderRadius: '20px'}}>
              
              {/* Header Modalidad */}
              <div className="p-3 text-white d-flex justify-content-between align-items-center"
                   style={{background: 'linear-gradient(135deg, #2c3e50 0%, #4e73df 100%)'}}>
                  <span className="fw-bold"><FaTrophy className="me-2"/> {rec.modalidad}</span>
                  <span className="badge bg-white text-primary rounded-pill">{rec.categoria}</span>
              </div>

              <div className="card-body p-0">
                {/* SECCIÓN RÉCORD ACTUAL */}
                <div className="p-4 bg-white position-relative">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <small className="text-uppercase text-success fw-bold letter-spacing-1">Récord Vigente</small>
                            <h3 className="fw-bold text-dark mt-1 mb-0">{rec.actual.deportista}</h3>
                            <p className="text-muted small mb-0">{rec.actual.competencia}</p>
                            <p className="text-muted small">{rec.actual.fecha}</p>
                        </div>
                        <div className="text-end">
                            <h1 className="display-4 fw-bold text-primary mb-0">{rec.actual.puntaje}</h1>
                            {rec.anterior && (
                                <span className="badge bg-success bg-opacity-10 text-success rounded-pill">
                                    <FaArrowUp size={10}/> +{rec.anterior.diferencia} pts
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECCIÓN RÉCORD ANTERIOR (Si existe) */}
                {rec.anterior ? (
                    <div className="p-3 bg-light border-top">
                        <div className="d-flex align-items-center text-muted">
                            <FaHistory className="me-3 fs-4 opacity-50"/>
                            <div className="flex-grow-1">
                                <div className="d-flex justify-content-between small">
                                    <span className="fw-bold text-uppercase">Récord Anterior</span>
                                    <span>{rec.anterior.fecha}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-1">
                                    <span>{rec.anterior.deportista}</span>
                                    <span className="fw-bold text-secondary">{rec.anterior.puntaje} pts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-light border-top text-center text-muted small">
                        <FaCrown className="text-warning me-1"/> Primer Récord Registrado
                    </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {records.length === 0 && (
            <div className="col-12 text-center py-5">
                <div className="alert alert-light">Aún no se han registrado récords en el sistema.</div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RecordsView;