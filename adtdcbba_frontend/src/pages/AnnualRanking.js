import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';
import { FaTrophy, FaCalendarAlt, FaPrint, FaStar } from 'react-icons/fa'; // <-- CORREGIDO (Quitada FaMedal)

const AnnualRanking = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const res = await competenciaService.getAnnualRanking(year);
        setRankingData(res.data.rankings_por_modalidad);
      } catch (err) {
        console.error("Error al cargar ranking", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [year]);

  const renderBadge = (pos) => {
    if (pos === 1) return <div className="d-flex align-items-center justify-content-center bg-warning text-white rounded-circle shadow-sm" style={{width: '35px', height: '35px'}}><FaStar/></div>;
    if (pos === 2) return <div className="d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle shadow-sm" style={{width: '35px', height: '35px'}}>2</div>;
    if (pos === 3) return <div className="d-flex align-items-center justify-content-center bg-brown text-white rounded-circle shadow-sm" style={{width: '35px', height: '35px', backgroundColor: '#CD7F32'}}>3</div>;
    return <span className="text-muted fw-bold ps-2">#{pos}</span>;
  };

  return (
    <div className="container fade-in pb-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
        <div>
            <h2 className="fw-bold text-dark mb-1">🏆 Ranking General Anual</h2>
            <p className="text-muted mb-0">Tabla de posiciones acumulada - Temporada {year}</p>
        </div>
        
        <div className="d-flex gap-3 bg-white p-2 rounded-pill shadow-sm border">
            <div className="input-group border-0" style={{width: '140px'}}>
                <span className="input-group-text bg-transparent border-0 ps-3"><FaCalendarAlt className="text-primary"/></span>
                <input 
                    type="number" 
                    className="form-control border-0 fw-bold text-primary" 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)}
                    min="2020" max="2030"
                />
            </div>
            <button className="btn btn-dark rounded-pill px-4" onClick={() => window.print()}>
                <FaPrint/>
            </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted fw-bold">Calculando posiciones...</p>
        </div>
      ) : (
        <>
            {rankingData.length === 0 ? (
                <div className="alert alert-light border text-center rounded-4 p-5">
                    <h4 className="text-muted">No hay datos para el año {year}</h4>
                    <p className="mb-0">Asegúrate de que haya competencias en estado <strong>"Finalizada"</strong>.</p>
                </div>
            ) : (
                <div className="row">
                    {rankingData.map((mod, idx) => (
                        <div key={idx} className="col-xl-6 mb-4">
                            <div className="card border-0 shadow-sm h-100 overflow-hidden" style={{borderRadius: '15px'}}>
                                
                                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded text-primary">
                                            <FaTrophy/>
                                        </div>
                                        <h5 className="fw-bold m-0 text-dark">{mod.modalidad}</h5>
                                    </div>
                                    <span className="badge bg-light text-dark border rounded-pill px-3">Oficial</span>
                                </div>

                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0 align-middle">
                                            <thead className="bg-light small text-uppercase text-muted">
                                                <tr>
                                                    <th className="ps-4 py-3">Pos</th>
                                                    <th className="py-3">Deportista</th>
                                                    <th className="py-3">Club</th>
                                                    <th className="text-center py-3">Eventos</th>
                                                    <th className="text-end pe-4 py-3">Total Puntos</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mod.ranking.map((row, rIdx) => (
                                                    <tr key={rIdx} className={rIdx === 0 ? 'bg-warning bg-opacity-10' : ''}>
                                                        <td className="ps-4">{renderBadge(row.posicion)}</td>
                                                        <td>
                                                            <div className="fw-bold text-dark">{row.deportista}</div>
                                                        </td>
                                                        <td className="text-muted small">{row.club}</td>
                                                        <td className="text-center">
                                                            <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-2">
                                                                {row.eventos_disputados}
                                                            </span>
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            <span className="fw-bold fs-5 text-primary">{row.puntaje_total}</span>
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
        </>
      )}
    </div>
  );
};

export default AnnualRanking;