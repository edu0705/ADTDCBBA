import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import deportistaService from '../services/deportistaService';
import competenciaService from '../services/competenciaService';
import { 
  FaUser, FaFilePdf, FaCrosshairs, FaCheckCircle, FaUpload, 
  FaArrowLeft, FaTrash, FaCalendarCheck, FaImage, FaHandshake, FaSearch, FaPrint, FaKey
} from 'react-icons/fa';

const DeportistaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deportista, setDeportista] = useState(null);
  const [activeTab, setActiveTab] = useState('docs'); 
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Estados Formularios
  const [newDoc, setNewDoc] = useState({ type: 'Licencia B', file: null, expiry: '' });
  const [newArma, setNewArma] = useState({ tipo: 'Pistola', marca: '', modelo: '', calibre: '', matricula: '', fecha_inspeccion: '', foto: null });
  
  // Estados Préstamo
  const [competencias, setCompetencias] = useState([]);
  const [loanData, setLoanData] = useState({ arma_id: '', competencia_id: '', arma_detalle: '' });
  
  // Estados Buscador Modal
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await deportistaService.getDeportistaById(id);
      setDeportista(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    fetchDetails();
    const loadComps = async () => {
        try {
            const res = await competenciaService.getCompetencias();
            const active = (res.data.results || res.data).filter(c => c.status !== 'Finalizada');
            setCompetencias(active);
        } catch (e) { console.error(e); }
    };
    loadComps();
  }, [fetchDetails]);

  // --- ACCIÓN: APROBAR Y GENERAR CREDENCIALES ---
  const handleActivate = async () => {
      if (window.confirm("¿Confirmas que la documentación está completa? Esto generará el usuario y contraseña del deportista.")) {
          try {
              // CORRECCIÓN: Llamamos al endpoint 'approve' que crea el usuario
              const res = await deportistaService.api.post(`deportistas/${id}/approve/`);
              
              alert(`✅ DEPORTISTA ACTIVADO\n\nUsuario: ${res.data.username}\nContraseña: ${res.data.password}\n\n¡Entregue estos datos al deportista!`);
              
              fetchDetails(); // Recargar para ver el estado 'Activo'
          } catch (err) { 
              console.error(err);
              alert("Error al activar deportista."); 
          }
      }
  };

  // --- GESTIÓN DE ARMAS ---
  const handleDeleteArma = async (armaId) => {
      if(window.confirm("¿Eliminar esta arma del registro?")) {
          try {
              await deportistaService.deleteArma(armaId);
              fetchDetails();
          } catch (err) { alert("Error al eliminar."); }
      }
  };

  const handleArmaSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData();
    formData.append('deportista', id);
    formData.append('tipo', newArma.tipo);
    formData.append('marca', newArma.marca);
    formData.append('modelo', newArma.modelo);
    formData.append('calibre', newArma.calibre);
    formData.append('numero_matricula', newArma.matricula);
    if (newArma.fecha_inspeccion) formData.append('fecha_inspeccion', newArma.fecha_inspeccion);
    if (newArma.foto) formData.append('file_path', newArma.foto);
    
    try { 
        await deportistaService.registerArma(formData); 
        alert("Arma registrada"); 
        setNewArma({ tipo: 'Pistola', marca: '', modelo: '', calibre: '', matricula: '', fecha_inspeccion: '', foto: null }); 
        fetchDetails(); 
    }
    catch { alert("Error al registrar arma"); } finally { setUploading(false); }
  };

  // --- GESTIÓN DE DOCUMENTOS ---
  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!newDoc.file) return alert("Seleccione archivo");
    setUploading(true);
    const formData = new FormData();
    formData.append('deportista', id);
    formData.append('document_type', newDoc.type);
    formData.append('file_path', newDoc.file);
    if (newDoc.expiry) formData.append('expiration_date', newDoc.expiry);
    try { await deportistaService.uploadDocument(formData); alert("Subido"); setNewDoc({...newDoc, file: null}); fetchDetails(); }
    catch { alert("Error"); } finally { setUploading(false); }
  };

  // --- GESTIÓN DE PRÉSTAMOS ---
  const handleSearch = async (e) => {
      e.preventDefault();
      if (!searchTerm) return;
      try {
          const res = await deportistaService.searchArmas(searchTerm);
          setSearchResults(res.data.results || res.data);
      } catch (err) { console.error("Error buscando armas", err); }
  };

  const selectArma = (arma) => {
      setLoanData({ 
          ...loanData, 
          arma_id: arma.id, 
          arma_detalle: `${arma.marca} ${arma.modelo} (${arma.calibre}) - Prop: ${arma.deportista_nombre || 'Desconocido'}` 
      });
      setShowSearch(false);
      setSearchResults([]);
      setSearchTerm('');
  };

  const handleCreateLoan = async () => {
      if (!loanData.arma_id || !loanData.competencia_id) return alert("Seleccione un arma y una competencia.");
      setUploading(true);
      try {
          const res = await deportistaService.createLoan({
              arma: loanData.arma_id,
              deportista_receptor: id,
              competencia: loanData.competencia_id
          });
          if(window.confirm("Préstamo registrado. ¿Desea imprimir el informe ahora?")) {
              deportistaService.downloadLoanReport(res.data.id);
          }
          setLoanData({ arma_id: '', competencia_id: '', arma_detalle: '' });
      } catch (err) {
          alert("Error al registrar préstamo: " + (err.response?.data?.detail || "Verifique los datos."));
      } finally { setUploading(false); }
  };

  if (loading) return <div className="text-center p-5">Cargando...</div>;
  if (!deportista) return <div className="text-center p-5">No encontrado</div>;

  return (
    <div className="container fade-in pb-5 position-relative">
      {/* MODAL BUSCADOR */}
      {showSearch && (
          <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center" style={{zIndex: 2000}}>
              <div className="bg-white rounded-4 p-4 shadow-lg w-100" style={{maxWidth: '600px'}}>
                  <div className="d-flex justify-content-between mb-3">
                      <h5 className="fw-bold m-0">Buscar Arma Disponible</h5>
                      <button className="btn-close" onClick={() => setShowSearch(false)}></button>
                  </div>
                  <form onSubmit={handleSearch} className="d-flex gap-2 mb-3">
                      <input autoFocus type="text" className="form-control" placeholder="Marca, Modelo o Matrícula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                      <button type="submit" className="btn btn-primary"><FaSearch/></button>
                  </form>
                  <div className="list-group overflow-auto" style={{maxHeight: '300px'}}>
                      {searchResults.map(arma => (
                          <button key={arma.id} className="list-group-item list-group-item-action" onClick={() => selectArma(arma)}>
                              <div className="d-flex justify-content-between"><strong>{arma.marca} {arma.modelo}</strong><span className="badge bg-secondary">{arma.calibre}</span></div>
                              <small className="text-muted">Mat: {arma.numero_matricula} • Prop: {arma.deportista ? arma.deportista.first_name : 'S/D'}</small>
                          </button>
                      ))}
                      {searchResults.length === 0 && searchTerm && <div className="text-center p-3 text-muted">Sin resultados.</div>}
                  </div>
              </div>
          </div>
      )}

      {/* HEADER DE PERFIL */}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <button onClick={() => navigate(-1)} className="btn btn-light rounded-pill text-muted fw-bold"><FaArrowLeft className="me-2"/> Volver</button>
          
          {deportista.status !== 'Activo' ? (
              <button onClick={handleActivate} className="btn btn-success rounded-pill px-4 shadow-sm fw-bold animate-pulse">
                  <FaCheckCircle className="me-2"/> Aprobar y Activar
              </button>
          ) : (
              <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success px-4 py-2 rounded-pill fs-6">Deportista Activo ✅</span>
                  {/* Botón para regenerar credenciales si se olvidaron */}
                  <button onClick={handleActivate} className="btn btn-sm btn-outline-warning rounded-circle" title="Regenerar Acceso">
                      <FaKey/>
                  </button>
              </div>
          )}
      </div>

      <div className="row">
        {/* TARJETA IZQUIERDA */}
        <div className="col-md-4 mb-4">
            <div className="card-elegant text-center p-4 h-100">
                <div className="mx-auto bg-light rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm" style={{width:'100px', height:'100px'}}>
                    {deportista.foto_path ? <img src={deportista.foto_path} className="w-100 h-100 rounded-circle object-fit-cover" alt="Perfil"/> : <FaUser size={40} className="text-secondary"/>}
                </div>
                <h4 className="fw-bold text-dark">{deportista.first_name} {deportista.apellido_paterno}</h4>
                <p className="text-muted small">{deportista.club_info || 'Sin Club'}</p>
                
                <div className="border-top pt-3 mt-2 text-start">
                    <p className="mb-1 small"><strong>CI:</strong> {deportista.ci}</p>
                    <p className="mb-1 small"><strong>Estado:</strong> {deportista.status}</p>
                </div>
            </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="col-md-8">
            <div className="card-elegant h-100">
                <div className="card-header-elegant pb-0 border-0 bg-white">
                    <ul className="nav nav-tabs border-0">
                        {['docs', 'armas', 'prestamos'].map(tab => (
                            <li className="nav-item" key={tab}>
                                <button className={`nav-link border-0 bg-transparent ${activeTab===tab ? 'active border-bottom border-3 border-primary fw-bold text-primary' : 'text-muted'}`} onClick={() => setActiveTab(tab)}>
                                    {tab === 'docs' && <><FaFilePdf className="me-2"/> Documentos</>}
                                    {tab === 'armas' && <><FaCrosshairs className="me-2"/> Armas</>}
                                    {tab === 'prestamos' && <><FaHandshake className="me-2"/> Préstamos</>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card-body p-4 bg-light bg-opacity-25">
                    {/* PESTAÑA DOCS */}
                    {activeTab === 'docs' && (
                        <div className="fade-in">
                            <h6 className="fw-bold mb-3">Documentos ({deportista.documentos?.length})</h6>
                            <ul className="list-group mb-4 shadow-sm">
                                {deportista.documentos?.map(doc => (
                                    <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>{doc.document_type} <small className="text-muted ms-2">Vence: {doc.expiration_date}</small></span>
                                        <a href={doc.file_path} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill">Ver</a>
                                    </li>
                                ))}
                            </ul>
                            <form onSubmit={handleDocUpload} className="bg-white p-3 rounded shadow-sm border">
                                <div className="d-flex gap-2 align-items-center">
                                    <select className="form-select form-select-sm" onChange={e=>setNewDoc({...newDoc, type: e.target.value})}><option>Licencia B</option><option>Carnet</option></select>
                                    <input type="file" className="form-control form-control-sm" onChange={e=>setNewDoc({...newDoc, file: e.target.files[0]})} />
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={uploading}><FaUpload/> Subir</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* PESTAÑA ARMAS */}
                    {activeTab === 'armas' && (
                        <div className="fade-in">
                            <h6 className="fw-bold mb-3">Mis Armas ({deportista.armas?.length})</h6>
                            {deportista.armas?.map(arma => (
                                <div key={arma.id} className="bg-white p-3 mb-2 rounded shadow-sm border d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{arma.marca} {arma.modelo}</strong>
                                        <div className="small text-muted">{arma.calibre} • {arma.numero_matricula}</div>
                                        <div className="small text-primary"><FaCalendarCheck className="me-1"/> Insp: {arma.fecha_inspeccion || 'Pendiente'}</div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        {arma.file_path && <a href={arma.file_path} target="_blank" rel="noreferrer" className="btn btn-sm btn-light"><FaImage/></a>}
                                        <button onClick={() => handleDeleteArma(arma.id)} className="btn btn-sm btn-outline-danger border-0"><FaTrash/></button>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="bg-white p-3 rounded shadow-sm border mt-3">
                                <h6 className="text-primary mb-2">Registrar Arma</h6>
                                <form onSubmit={handleArmaSubmit} className="row g-2">
                                    <div className="col-4"><input className="form-control form-control-sm" placeholder="Marca" onChange={e=>setNewArma({...newArma, marca: e.target.value})} required/></div>
                                    <div className="col-4"><input className="form-control form-control-sm" placeholder="Modelo" onChange={e=>setNewArma({...newArma, modelo: e.target.value})} required/></div>
                                    <div className="col-4"><input className="form-control form-control-sm" placeholder="Calibre" onChange={e=>setNewArma({...newArma, calibre: e.target.value})} required/></div>
                                    <div className="col-6"><input className="form-control form-control-sm" placeholder="Matrícula" onChange={e=>setNewArma({...newArma, matricula: e.target.value})} required/></div>
                                    <div className="col-6"><input type="date" className="form-control form-control-sm" onChange={e=>setNewArma({...newArma, fecha_inspeccion: e.target.value})} /></div>
                                    <div className="col-12"><button type="submit" className="btn btn-primary btn-sm w-100" disabled={uploading}>Guardar Arma</button></div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* PESTAÑA PRÉSTAMOS */}
                    {activeTab === 'prestamos' && (
                        <div className="fade-in text-center py-4">
                             <div className="bg-white p-4 rounded-4 shadow-sm border">
                                <FaHandshake size={30} className="text-primary mb-2"/>
                                <h5 className="fw-bold">Solicitar Préstamo</h5>
                                <select className="form-select form-select-sm mb-3" value={loanData.competencia_id} onChange={e => setLoanData({...loanData, competencia_id: e.target.value})}>
                                    <option value="">-- Competencia --</option>
                                    {competencias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="input-group input-group-sm mb-3">
                                    <input type="text" className="form-control bg-light" readOnly value={loanData.arma_detalle || ''} placeholder="Buscar arma..." />
                                    <button className="btn btn-outline-primary" type="button" onClick={() => setShowSearch(true)}><FaSearch/> Buscar</button>
                                </div>
                                <button className="btn btn-primary w-100 rounded-pill" onClick={handleCreateLoan} disabled={uploading}>
                                    <FaPrint className="me-2"/> Generar Informe
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeportistaDetail;