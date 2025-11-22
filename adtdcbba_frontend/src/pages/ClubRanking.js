import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';
import { FaShieldAlt, FaTrophy, FaCrown, FaCalendarAlt, FaPrint } from 'react-icons/fa';

const ClubRanking = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const res = await competenciaService.getClubRanking(year);
        setRanking(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [year]);

  const renderRankIcon = (pos) => {
    if (pos === 1) return <FaCrown size={24} className="text-warning" />;
    if (pos === 2) return <span className="fw-bold text-secondary fs-4">2</span>;
    if (pos === 3) return <span className="fw-bold text-muted fs-4" style={{color: '#cd7f32'}}>3</span>;
    return <span className="fw-bold text-muted">{pos}</span>;
  };

  return (
    <div className="container fade-in pb-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h2 className="fw-bold text-dark mb-0">Copa de Clubes</h2>
            <p className="text-muted">Ranking Institucional {year}</p>
        </div>
        <div className="d-flex gap-2">
            <div className="input-group shadow-sm" style={{width: '140px'}}>
                 <span className="input-group-text bg-white border-0"><FaCalendarAlt className="text-primary"/></span>
                 <input type="number" className="form-control border-0" value={year} onChange={e=>setYear(e.target.value)}/>
            </div>
            <button className="btn btn-dark rounded-pill px-3" onClick={()=>window.print()}><FaPrint/></button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="card-elegant overflow-hidden">
            <div className="card-header-elegant bg-primary text-white p-4 d-flex justify-content-between align-items-center"
                 style={{background: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 100%)'}}>
                <h4 className="m-0 fw-bold"><FaShieldAlt className="me-2"/> Tabla de Posiciones</h4>
                <span className="badge bg-white text-dark bg-opacity-75">Oficial</span>
            </div>
            
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-uppercase small">
                        <tr>
                            <th className="text-center p-3" style={{width:'80px'}}>Pos</th>
                            <th className="p-3">Club</th>
                            <th className="text-end p-3 pe-5">Puntos de Campeonato</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranking.map((club, idx) => (
                            <tr key={idx} className={idx===0 ? 'bg-warning bg-opacity-10' : ''}>
                                <td className="text-center">
                                    {/* AQUÍ ESTABA EL ERROR, AHORA ESTÁ CORREGIDO */}
                                    {renderRankIcon(club.posicion)}
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
                                            <FaShieldAlt className="text-primary"/>
                                        </div>
                                        <span className={`fw-bold ${idx===0 ? 'text-dark fs-5' : 'text-secondary'}`}>
                                            {club.club}
                                        </span>
                                        {idx===0 && <span className="badge bg-warning text-dark rounded-pill ms-2">Líder</span>}
                                    </div>
                                </td>
                                <td className="text-end pe-5">
                                    <span className="fw-bold fs-4 text-primary">{club.puntos}</span>
                                </td>
                            </tr>
                        ))}
                        {ranking.length === 0 && <tr><td colSpan="3" className="text-center p-5 text-muted">No hay datos suficientes para generar el ranking.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
      )}
      
      <div className="mt-4 alert alert-light border small text-muted">
        <strong><FaTrophy className="me-1"/> Sistema de Puntuación:</strong> 
        Oro = 3 pts, Plata = 2 pts, Bronce = 1 pt. 
        Solo suman puntos las categorías válidas (con 3+ participantes para podio completo, o según regla de quórum).
      </div>
    </div>
  );
};

export default ClubRanking;