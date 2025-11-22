import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import competenciaService from '../services/competenciaService';
import { FaCheckCircle, FaTimesCircle, FaClipboardList } from 'react-icons/fa';

const CompetitionStats = () => {
  const [competencias, setCompetencias] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
        const res = await competenciaService.getCompetencias();
        setCompetencias((res.data.results || res.data).filter(c => c.status === 'Próxima'));
    };
    load();
  }, []);

  useEffect(() => {
      if(!selectedComp) return;
      const fetchStats = async () => {
          setLoading(true);
          try {
              const res = await competenciaService.getCompetenciaStats(selectedComp);
              setStats(res.data);
          } catch(e) { console.error(e); }
          finally { setLoading(false); }
      };
      fetchStats();
  }, [selectedComp]);

  const groupedStats = stats.reduce((acc, item) => {
      if(!acc[item.modalidad]) acc[item.modalidad] = [];
      acc[item.modalidad].push(item);
      return acc;
  }, {});

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark">Estado de Categorías</h2>
            <p className="text-muted">Verifica el quórum para la apertura de categorías.</p>
          </div>
          {selectedComp && (
              <Link to={`/register-inscripcion?comp=${selectedComp}`} className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold">
                  <FaClipboardList className="me-2"/> Pre-Inscribirme Ahora
              </Link>
          )}
      </div>

      <div className="card-elegant mb-4 p-4 bg-white">
          <label className="fw-bold mb-2 text-primary">Seleccionar Competencia Próxima:</label>
          <select className="form-select" value={selectedComp} onChange={e=>setSelectedComp(e.target.value)}>
              <option value="">-- Seleccione Evento --</option>
              {competencias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
      </div>

      {loading && <div className="text-center p-5">Cargando datos...</div>}

      {selectedComp && !loading && (
          <div className="row">
              {Object.entries(groupedStats).map(([modName, categories]) => (
                  <div key={modName} className="col-12 mb-4">
                      <div className="card-elegant h-100">
                          <div className="card-header-elegant bg-dark text-white">
                              <h5 className="m-0">{modName}</h5>
                          </div>
                          <div className="card-body p-0">
                              <div className="table-responsive">
                                  <table className="table table-hover mb-0 align-middle">
                                      <thead className="bg-light small text-muted">
                                          <tr>
                                              <th className="ps-4">Categoría</th>
                                              <th className="text-center">Inscritos</th>
                                              <th className="text-center">Estado</th>
                                              <th>Lista de Atletas</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {categories.map((cat, idx) => (
                                              <tr key={idx}>
                                                  <td className="ps-4 fw-bold">{cat.categoria}</td>
                                                  <td className="text-center fs-5">{cat.inscritos}</td>
                                                  <td className="text-center">
                                                      {cat.estado_categoria === 'ABIERTA' ? (
                                                          <span className="badge bg-success"><FaCheckCircle className="me-1"/> ABIERTA</span>
                                                      ) : (
                                                          <span className="badge bg-danger bg-opacity-75">
                                                              <FaTimesCircle className="me-1"/> CERRADA
                                                              <span className="d-block small mt-1" style={{fontSize:'0.6rem'}}>Faltan {cat.faltantes}</span>
                                                          </span>
                                                      )}
                                                  </td>
                                                  <td className="small text-muted">
                                                      {cat.lista.length > 0 ? (
                                                          cat.lista.map((p, i) => (
                                                              <span key={i} className={`badge border me-1 mb-1 ${p.estado==='APROBADA'?'bg-light text-success border-success':'bg-light text-secondary'}`}>
                                                                  {p.nombre}
                                                              </span>
                                                          ))
                                                      ) : <span>Sin inscritos</span>}
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default CompetitionStats;