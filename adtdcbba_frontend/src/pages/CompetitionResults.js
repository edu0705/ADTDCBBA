import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import competenciaService from '../services/competenciaService';
import { FaMedal, FaPrint, FaArrowLeft, FaCrosshairs, FaCalendarAlt, FaCertificate, FaGlobeAmericas, FaMapMarkerAlt, FaFilePdf } from 'react-icons/fa';

const CompetitionResults = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('local'); // 'local' | 'nacional'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await competenciaService.getOfficialResults(id);
        setData(res.data);
        if (res.data.competencia.toUpperCase().includes('NACIONAL')) setViewMode('nacional');
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-5 text-center">Cargando...</div>;
  if (!data) return <div className="p-5 text-center">Sin datos.</div>;

  const processResults = (resultados) => {
      let filtered = resultados;
      if (viewMode === 'local') filtered = resultados.filter(r => !r.es_invitado);
      return filtered;
  };

  const renderRank = (index) => {
    if (index === 0) return <FaMedal size={24} color="#FFD700" title="Oro" />;
    if (index === 1) return <FaMedal size={24} color="#C0C0C0" title="Plata" />;
    if (index === 2) return <FaMedal size={24} color="#CD7F32" title="Bronce" />;
    return <span className="badge bg-light text-secondary rounded-circle p-2">{index + 1}</span>;
  };

  return (
    <div className="container pb-5 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <Link to="/admin/resultados" className="btn btn-light text-primary fw-bold rounded-pill px-4 shadow-sm"><FaArrowLeft className="me-2"/> Volver</Link>
        
        <div className="btn-group shadow-sm rounded-pill overflow-hidden">
            <button className={`btn px-4 fw-bold ${viewMode === 'local' ? 'btn-primary' : 'btn-light'}`} onClick={() => setViewMode('local')}><FaMapMarkerAlt className="me-2"/> Departamental</button>
            <button className={`btn px-4 fw-bold ${viewMode === 'nacional' ? 'btn-info text-white' : 'btn-light'}`} onClick={() => setViewMode('nacional')}><FaGlobeAmericas className="me-2"/> Nacional (Open)</button>
        </div>

        <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={() => window.print()}><FaPrint className="me-2" /> Imprimir</button>
      </div>

      <div className="bg-white p-5 rounded-4 shadow-sm mb-5 text-center border-bottom border-5 border-primary">
        <h1 className="fw-bold text-dark text-uppercase mb-2">{data.competencia}</h1>
        <div className="d-inline-flex align-items-center gap-3 px-4 py-2 bg-light rounded-pill shadow-sm mt-2">
            <span className="text-muted fw-bold text-uppercase small"><FaCalendarAlt className="me-2"/>{data.fecha}</span>
            <span className="vr"></span>
            <span className={`fw-bold text-uppercase small ${viewMode==='local'?'text-primary':'text-info'}`}>Resultados {viewMode === 'local' ? 'Departamentales' : 'Nacionales'}</span>
        </div>
        {data.pdf_url && <div className="mt-4"><a href={data.pdf_url} target="_blank" rel="noreferrer" className="btn btn-danger rounded-pill px-4 shadow hover-scale"><FaFilePdf className="me-2"/> Ver PDF Original</a></div>}
      </div>

      {data.modalidades.map((mod, idx) => (
        <div key={idx} className="card border-0 shadow-sm mb-5 overflow-hidden" style={{borderRadius: '20px'}}>
          <div className="p-4 text-white d-flex align-items-center justify-content-between" style={{background: viewMode==='local' ? 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 100%)' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'}}>
            <div className="d-flex align-items-center gap-3"><div className="bg-white bg-opacity-20 p-2 rounded-3"><FaCrosshairs size={24} /></div><h3 className="m-0 fw-bold h4">{mod.nombre}</h3></div>
            <span className="badge bg-white text-dark bg-opacity-75 backdrop-blur">Modalidad</span>
          </div>

          <div className="card-body p-0 bg-white">
            {mod.categorias.map((cat, cIdx) => {
                const resultadosFiltrados = processResults(cat.resultados);
                if (resultadosFiltrados.length === 0) return null;
                const isIPSC = mod.nombre.toUpperCase().includes('IPSC') || mod.nombre.toUpperCase().includes('PRACTICO');

                return (
                  <div key={cIdx} className="p-4 border-bottom last:border-0">
                    <div className="d-flex align-items-center mb-4"><div className={`h-100 rounded-pill me-3 ${viewMode==='local'?'bg-primary':'bg-info'}`} style={{width: '4px', height: '25px'}}></div><h5 className="fw-bold text-secondary m-0 text-uppercase letter-spacing-1">Categoría {cat.nombre}</h5></div>
                    <div className="table-responsive rounded-3 border">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-secondary small text-uppercase">
                          <tr>
                            <th className="text-center py-3" style={{width: '60px'}}>Pos</th>
                            <th className="py-3">Deportista</th>
                            <th className="py-3">{viewMode === 'local' ? 'Club' : 'Origen'}</th>
                            {isIPSC ? <><th className="text-end">Match %</th><th className="text-end pe-4">Points</th></> : <th className="text-end py-3 pe-4">Puntaje</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {resultadosFiltrados.map((res, rIdx) => (
                            <tr key={rIdx} className={rIdx < 3 ? 'bg-warning bg-opacity-10 fw-bold' : ''}>
                              <td className="text-center py-3">{renderRank(rIdx)}</td>
                              <td>
                                  <div className="d-flex align-items-center gap-2">
                                      {rIdx === 0 && <span className="text-warning">👑</span>}
                                      {res.deportista}
                                      {res.es_invitado && <span className="badge bg-info text-white ms-2" style={{fontSize:'0.6rem'}}>INV</span>}
                                  </div>
                              </td>
                              <td className="text-muted small">{viewMode === 'nacional' ? (res.es_invitado ? res.origen : `Cbba (${res.club})`) : res.club}</td>
                              {isIPSC ? (
                                  <>
                                      <td className="text-end text-muted">{res.extra_info}</td>
                                      <td className="text-end pe-4 fw-bold fs-5 text-primary">{res.puntaje}</td>
                                  </>
                              ) : (
                                  <td className="text-end pe-4">
                                    <div className="d-flex justify-content-end align-items-center gap-3">
                                        <span className={`fs-5 ${rIdx < 3 ? 'text-primary' : 'text-dark'}`}>{res.puntaje}</span>
                                        {rIdx < 3 && (!res.es_invitado || viewMode === 'nacional') && (
                                            <button className="btn btn-sm btn-outline-warning border-0" onClick={() => competenciaService.downloadDiploma(res.id, res.deportista)}><FaCertificate size={20}/></button>
                                        )}
                                    </div>
                                  </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompetitionResults;