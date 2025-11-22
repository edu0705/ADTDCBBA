import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import competenciaService from '../services/competenciaService';
import { 
  FaTimes, FaSearch, FaFilter, FaCrosshairs, 
  FaUser, FaMoneyBillWave, FaEdit, FaSave, FaPrint, FaTrash 
} from 'react-icons/fa';

const ManageInscripciones = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  
  // Filters
  const [filterText, setFilterText] = useState('');
  const [filterComp, setFilterComp] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  
  const [loading, setLoading] = useState(true);
  
  // Edit Payment State
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ monto: 0, obs: '' });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resInsc, resComp] = await Promise.all([
        competenciaService.getInscripciones(),
        competenciaService.getCompetencias()
      ]);
      setInscripciones(resInsc.data.results || resInsc.data);
      setCompetencias(resComp.data.results || resComp.data);
    } catch (err) {
      console.error("Error cargando datos", err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  // 1. Change Status (Approve/Reject)
  const handleStatusChange = async (id, nuevoEstado) => {
      if(!window.confirm(`¿Estás seguro de cambiar el estado a ${nuevoEstado}?`)) return;
      try {
          await competenciaService.updateInscripcion(id, { estado: nuevoEstado });
          loadData();
      } catch (err) { alert("Error al actualizar."); }
  };

  const startEdit = (ins) => {
      setEditId(ins.id);
      setEditData({ 
          monto: ins.monto_pagado || ins.costo_inscripcion, 
          obs: ins.observaciones_pago || '' 
      });
  };

  const savePayment = async (id) => {
      try {
          await competenciaService.updateInscripcion(id, {
              monto_pagado: editData.monto,
              observaciones_pago: editData.obs,
              estado: 'APROBADA'
          });
          setEditId(null);
          loadData();
      } catch (err) { alert("Error al guardar pago."); }
  };

  const handlePrint = (id) => {
      competenciaService.downloadReceipt(id);
  };

  const handleDeleteInscripcion = async (id) => {
      if(!window.confirm("¿Eliminar esta inscripción?")) return;
      try {
          await competenciaService.deleteInscripcion(id);
          loadData();
      } catch (err) { alert("No se puede eliminar si ya tiene resultados."); }
  };

  const handleEditCategories = (ins) => {
      if (ins.estado === 'APROBADA' && !window.confirm("Ya está aprobada. ¿Modificar categorías?")) return;
      navigate('/register-inscripcion', { state: { competenciaId: ins.competencia, deportistaId: ins.deportista }});
  };

  // --- FILTERING ---
  const filteredData = inscripciones.filter(ins => {
      const matchText = 
        ins.deportista_nombre.toLowerCase().includes(filterText.toLowerCase()) ||
        ins.deportista_apellido.toLowerCase().includes(filterText.toLowerCase()) ||
        (ins.club_nombre && ins.club_nombre.toLowerCase().includes(filterText.toLowerCase()));
      
      const matchComp = filterComp ? ins.competencia === parseInt(filterComp) : true;
      const matchEstado = filterEstado ? ins.estado === filterEstado : true;
      return matchText && matchComp && matchEstado;
  });

  const totalEsperado = filteredData.reduce((acc, curr) => acc + parseFloat(curr.costo_inscripcion || 0), 0);
  const totalRecaudado = filteredData.reduce((acc, curr) => acc + parseFloat(curr.monto_pagado || 0), 0);

  const renderBadge = (status) => {
      switch(status) {
          case 'APROBADA': return <span className="badge bg-success rounded-pill px-3">Inscrito</span>;
          case 'RECHAZADA': return <span className="badge bg-danger rounded-pill px-3">Rechazado</span>;
          default: return <span className="badge bg-warning text-dark rounded-pill px-3">Pendiente</span>;
      }
  };

  if (loading) return <div className="text-center p-5">Cargando...</div>;

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 className="fw-bold text-dark mb-1">Tesorería e Inscripciones</h2>
            <p className="text-muted">Control de caja y habilitación.</p>
        </div>
        
        {filterComp && (
            <div className="bg-white p-3 rounded-4 shadow-sm border d-flex gap-4">
                <div className="text-end">
                    <small className="d-block text-muted text-uppercase" style={{fontSize:'0.7rem'}}>Por Cobrar</small>
                    <span className="fw-bold text-secondary">{totalEsperado} Bs</span>
                </div>
                <div className="vr"></div>
                <div className="text-end">
                    <small className="d-block text-muted text-uppercase" style={{fontSize:'0.7rem'}}>Recaudado</small>
                    <span className="fw-bold text-success fs-5">{totalRecaudado} Bs</span>
                </div>
            </div>
        )}
      </div>

      {/* FILTERS BAR */}
      <div className="card-elegant mb-4 p-3">
          <div className="row g-3">
              <div className="col-md-4">
                  <div className="input-group border rounded-pill overflow-hidden bg-light">
                      <span className="input-group-text border-0 bg-transparent ps-3"><FaSearch className="text-muted"/></span>
                      <input type="text" className="form-control border-0 bg-transparent" placeholder="Buscar..." value={filterText} onChange={e=>setFilterText(e.target.value)}/>
                  </div>
              </div>
              <div className="col-md-3">
                  <select className="form-select rounded-pill border-light bg-light" value={filterComp} onChange={e=>setFilterComp(e.target.value)}>
                      <option value="">-- Todas las Competencias --</option>
                      {competencias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>
              <div className="col-md-3">
                  <select className="form-select rounded-pill border-light bg-light" value={filterEstado} onChange={e=>setFilterEstado(e.target.value)}>
                      <option value="">Todos los Estados</option>
                      <option value="PENDIENTE">Pendientes</option>
                      <option value="APROBADA">Aprobadas</option>
                  </select>
              </div>
              <div className="col-md-2 text-end">
                  <button className="btn btn-light rounded-circle shadow-sm" title="Recargar" onClick={loadData}>
                      <FaFilter className="text-primary"/>
                  </button>
              </div>
          </div>
      </div>

      {/* LIST */}
      <div className="row">
          {filteredData.length === 0 && (
              <div className="col-12 text-center py-5 text-muted">No hay inscripciones que coincidan.</div>
          )}

          {filteredData.map(ins => (
              <div key={ins.id} className="col-12 mb-3">
                  <div className={`card border-0 shadow-sm rounded-4 overflow-hidden transition-all ${parseFloat(ins.monto_pagado) < parseFloat(ins.costo_inscripcion) ? 'border-start border-5 border-warning' : 'border-start border-5 border-success'}`}>
                      <div className="card-body p-0 d-flex flex-column flex-lg-row">
                          
                          {/* 1. DEPORTISTA INFO */}
                          <div className="p-3 border-end" style={{minWidth: '250px', background: '#f8f9fc'}}>
                              <div className="d-flex align-items-center gap-3 mb-2">
                                  <div className="bg-white p-2 rounded-circle shadow-sm text-primary"><FaUser/></div>
                                  <div>
                                      <h6 className="fw-bold m-0 text-dark">{ins.deportista_nombre} {ins.deportista_apellido}</h6>
                                      <small className="text-muted">{ins.club_nombre}</small>
                                  </div>
                              </div>
                              <div className="badge bg-primary bg-opacity-10 text-primary w-100">{ins.competencia_nombre}</div>
                          </div>

                          {/* 2. TECHNICAL DETAIL */}
                          <div className="p-3 flex-grow-1 border-end">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="text-secondary small fw-bold text-uppercase m-0">Detalle</h6>
                                  <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => handleEditCategories(ins)}>
                                      <FaEdit/> Modificar
                                  </button>
                              </div>
                              <div className="row g-2">
                                  {ins.participaciones.map(part => (
                                      <div key={part.id} className="col-md-6">
                                          <div className="d-flex align-items-center gap-2 p-2 border rounded bg-white small">
                                              <FaCrosshairs className="text-muted"/>
                                              <div>
                                                  <div className="fw-bold">{part.categoria_name || part.modalidad_name}</div>
                                                  <div className="text-muted" style={{fontSize: '0.7rem'}}>
                                                      {part.arma_info || <span className="text-danger">Sin Arma</span>}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* 3. FINANCIAL MANAGEMENT */}
                          <div className="p-3 bg-white" style={{minWidth: '300px'}}>
                              {editId === ins.id ? (
                                  <div className="fade-in">
                                      <label className="small fw-bold text-muted">Monto a Pagar (Total: {ins.costo_inscripcion})</label>
                                      <div className="input-group input-group-sm mb-2">
                                          <span className="input-group-text">Bs</span>
                                          <input type="number" className="form-control" value={editData.monto} onChange={e=>setEditData({...editData, monto: e.target.value})}/>
                                      </div>
                                      <input type="text" className="form-control form-control-sm mb-2" placeholder="Observación (ej: QR 123)" value={editData.obs} onChange={e=>setEditData({...editData, obs: e.target.value})}/>
                                      <div className="d-flex gap-2">
                                          <button className="btn btn-success btn-sm w-100" onClick={()=>savePayment(ins.id)}><FaSave/> Guardar</button>
                                          <button className="btn btn-light btn-sm" onClick={()=>setEditId(null)}><FaTimes/></button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="d-flex flex-column h-100 justify-content-center">
                                      <div className="mb-2 text-center">{renderBadge(ins.estado)}</div>

                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                          <span className="text-muted small">Costo Total:</span>
                                          <strong className="fs-5">{ins.costo_inscripcion} Bs</strong>
                                      </div>
                                      <div className="d-flex justify-content-between align-items-center mb-3">
                                          <span className="text-muted small">Pagado:</span>
                                          <strong className={`fs-5 ${parseFloat(ins.monto_pagado) >= parseFloat(ins.costo_inscripcion) ? 'text-success' : 'text-warning'}`}>
                                              {ins.monto_pagado} Bs
                                          </strong>
                                      </div>
                                      {ins.observaciones_pago && (
                                          <div className="alert alert-light p-2 small mb-3 border"><FaMoneyBillWave className="me-1"/> {ins.observaciones_pago}</div>
                                      )}
                                      
                                      <div className="d-flex gap-2 justify-content-end">
                                          <button className="btn btn-outline-primary btn-sm" onClick={()=>startEdit(ins)}><FaEdit/></button>
                                          
                                          {ins.estado === 'PENDIENTE' && (
                                              <div className="btn-group">
                                                  <button className="btn btn-outline-danger btn-sm" title="Rechazar" onClick={()=>handleStatusChange(ins.id, 'RECHAZADA')}>
                                                      <FaTimes/>
                                                  </button>
                                                  <button className="btn btn-outline-secondary btn-sm" title="Eliminar" onClick={()=>handleDeleteInscripcion(ins.id)}>
                                                      <FaTrash/>
                                                  </button>
                                              </div>
                                          )}
                                          
                                          {(ins.estado === 'APROBADA' || parseFloat(ins.monto_pagado) > 0) && (
                                              <button className="btn btn-dark btn-sm" title="Imprimir Recibo" onClick={()=>handlePrint(ins.id)}>
                                                  <FaPrint/>
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>

                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default ManageInscripciones;