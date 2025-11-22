import React, { useState, useEffect } from 'react';
import deportistaService from '../services/deportistaService';
import { FaUserCircle, FaIdCard, FaCrosshairs, FaHistory, FaTrophy, FaChartLine, FaFilePdf, FaEdit, FaInfoCircle } from 'react-icons/fa';

const MiPerfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const resPerfil = await deportistaService.api.get('deportistas/mi-perfil/');
        setPerfil(resPerfil.data);
        const resStats = await deportistaService.getStats(); 
        setStats(resStats.data);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    loadAll();
  }, []);

  const handleRequestUpdate = () => {
      const motivo = prompt("Describa qué dato necesita actualizar (Ej: Renovación Licencia B):");
      if (motivo) alert("Solicitud enviada al administrador. Por favor envíe la foto del comprobante.");
  };

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (!perfil) return <div className="text-center p-5">Perfil no disponible.</div>;

  return (
    <div className="container py-5 fade-in">
      <div className="row mb-5">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-lg overflow-hidden" style={{borderRadius: '20px'}}>
            <div className="card-body p-0">
                <div className="row g-0">
                    <div className="col-md-4 bg-primary text-white text-center p-4 d-flex flex-column align-items-center justify-content-center" style={{background: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 100%)'}}>
                        <div className="bg-white p-1 rounded-circle mb-3 shadow">
                             {perfil.foto_path ? <img src={perfil.foto_path} className="rounded-circle" style={{width:'100px', height:'100px', objectFit:'cover'}} alt="Foto"/> : <FaUserCircle size={100} className="text-secondary"/>}
                        </div>
                        <h4 className="fw-bold m-0">{perfil.first_name}</h4>
                        <span className="opacity-75">{perfil.apellido_paterno}</span>
                        <div className="mt-3 badge bg-white text-primary rounded-pill px-3">{perfil.club_info}</div>
                    </div>
                    <div className="col-md-8 p-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold text-dark m-0">Información Atleta</h5>
                            <button className="btn btn-outline-dark btn-sm rounded-pill" onClick={() => deportistaService.downloadCarnet(perfil.id, perfil.first_name)}><FaIdCard className="me-2"/> Credencial</button>
                        </div>
                        <div className="row g-3 mb-4">
                            <div className="col-6"><small className="d-block text-muted">CI/DNI</small><strong>{perfil.ci}</strong></div>
                            <div className="col-6"><small className="d-block text-muted">Departamento</small><strong>{perfil.departamento}</strong></div>
                            <div className="col-6"><small className="d-block text-muted">Fecha Nac.</small><strong>{perfil.birth_date}</strong></div>
                            <div className="col-6"><small className="d-block text-muted">Estado</small><span className="text-success fw-bold">{perfil.status}</span></div>
                        </div>
                        <div className="d-grid gap-2">
                             <button className="btn btn-danger rounded-pill shadow-sm fw-bold" onClick={() => deportistaService.downloadCV(perfil.id)}><FaFilePdf className="me-2"/> Descargar CV Deportivo</button>
                             <button className="btn btn-outline-primary rounded-pill shadow-sm" onClick={handleRequestUpdate}><FaEdit className="me-2"/> Solicitar Actualización de Datos</button>
                        </div>
                        <div className="alert alert-light border mt-3 small text-muted mb-0 py-2"><FaInfoCircle className="me-2"/> Por seguridad, los datos son inmutables. Envíe una solicitud para cambios.</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN ESTADÍSTICAS (Aquí usamos las variables 'stats', FaHistory, FaTrophy, etc.) */}
      {stats && (
          <div className="row mb-4">
              <div className="col-md-4">
                  <div className="card border-0 shadow-sm h-100 text-center py-4">
                      <FaHistory size={30} className="text-primary mb-2"/>
                      <h3>{stats.total_torneos}</h3>
                      <small>Torneos</small>
                  </div>
              </div>
              <div className="col-md-4">
                  <div className="card border-0 shadow-sm h-100 text-center py-4">
                      <FaTrophy size={30} className="text-warning mb-2"/>
                      <h3>{stats.records_totales}</h3>
                      <small>Récords</small>
                  </div>
              </div>
              <div className="col-md-4">
                  <div className="card border-0 shadow-sm h-100 p-3">
                      <h6 className="text-muted"><FaChartLine className="me-2"/> Rendimiento</h6>
                      {stats.estadisticas.map((s, i) => (
                          <div key={i} className="d-flex justify-content-between small mb-1">
                              <span>{s.modalidad}</span>
                              <span className="fw-bold">{s.promedio_personal} pts</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* ARMAS Y DOCUMENTOS */}
      <div className="row">
        <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header bg-white border-0 pt-4 px-4"><h6 className="fw-bold m-0"><FaCrosshairs className="me-2 text-primary"/> Mi Armamento</h6></div>
                <div className="card-body">
                    {perfil.armas?.length > 0 ? (
                        <ul className="list-group list-group-flush small">
                            {perfil.armas.map(a => (
                                <li key={a.id} className="list-group-item px-0">
                                    <strong>{a.marca} {a.modelo}</strong> <span className="text-muted">({a.calibre})</span>
                                    <br/><span className="text-secondary font-monospace">{a.numero_matricula}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-muted small text-center">Sin armas registradas.</p>}
                </div>
            </div>
        </div>
        <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header bg-white border-0 pt-4 px-4"><h6 className="fw-bold m-0"><FaIdCard className="me-2 text-info"/> Documentos</h6></div>
                <div className="card-body">
                    {perfil.documentos?.length > 0 ? (
                        <ul className="list-group list-group-flush small">
                            {perfil.documentos.map(d => (
                                <li key={d.id} className="list-group-item px-0 d-flex justify-content-between">
                                    <span>{d.document_type}</span>
                                    <span className="text-success">Vigente</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-muted small text-center">Sin documentos.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MiPerfil;