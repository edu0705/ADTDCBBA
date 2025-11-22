import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import competenciaService from '../services/competenciaService';
import deportistaService from '../services/deportistaService';
import { FaSave, FaClipboardList, FaCrosshairs, FaInfoCircle, FaMoneyBillWave, FaPlusCircle, FaTag, FaHandshake } from 'react-icons/fa';

const RegisterInscripcion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Datos Maestros
  const [competencias, setCompetencias] = useState([]);
  const [deportistas, setDeportistas] = useState([]);
  const [misArmas, setMisArmas] = useState([]);
  const [misPrestamos, setMisPrestamos] = useState([]);
  
  // Configuración Financiera
  const [preciosCategorias, setPreciosCategorias] = useState([]);
  const [costoBase, setCostoBase] = useState(0);

  // Formulario
  const [selectedCompetencia, setSelectedCompetencia] = useState('');
  const [selectedDeportista, setSelectedDeportista] = useState('');
  const [inscripcionExistente, setInscripcionExistente] = useState(null);
  
  // Selección: { categoriaId: armaId }
  const [seleccion, setSeleccion] = useState({}); 
  const [totalPagar, setTotalPagar] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
        try {
          const [resComp, resDep] = await Promise.all([
            competenciaService.getCompetencias(),
            deportistaService.getAllDeportistas()
          ]);
          
          const activeComps = (resComp.data.results || resComp.data).filter(c => c.status !== 'Finalizada');
          setCompetencias(activeComps);
          setDeportistas(resDep.data.results || resDep.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadInitialData();
  }, []);

  // Efecto para PRE-CARGAR datos si venimos de "Modificar Categorías"
  useEffect(() => {
      if (location.state?.competenciaId && location.state?.deportistaId) {
          setSelectedCompetencia(location.state.competenciaId.toString());
          setSelectedDeportista(location.state.deportistaId.toString());
      }
      const searchParams = new URLSearchParams(location.search);
      const compParam = searchParams.get('comp');
      if (compParam) setSelectedCompetencia(compParam);
  }, [location.state, location.search]);

  // Al cambiar competencia: Cargar precios y verificar inscripción previa
  useEffect(() => {
      if(selectedCompetencia) {
          const comp = competencias.find(c => c.id === parseInt(selectedCompetencia));
          if(comp) {
              setCostoBase(parseFloat(comp.costo_inscripcion_base || 0));
              setPreciosCategorias(comp.lista_precios || []);
              if (!inscripcionExistente) setSeleccion({});
          }
          
          if(selectedDeportista) {
             const checkExisting = async () => {
                 try {
                     const res = await competenciaService.getInscripciones();
                     const existente = (res.data.results || res.data).find(i => 
                        i.deportista === parseInt(selectedDeportista) && i.competencia === parseInt(selectedCompetencia)
                     );
                     setInscripcionExistente(existente);
                     
                     if(existente) {
                         setCostoBase(0); // Si ya existe, no cobramos base de nuevo
                     } else {
                         setCostoBase(parseFloat(comp?.costo_inscripcion_base || 0));
                     }
                 } catch (e) { console.error(e); }
             };
             checkExisting();
          }
      } else {
          setPreciosCategorias([]);
          setCostoBase(0);
      }
  }, [selectedCompetencia, selectedDeportista, competencias, inscripcionExistente]);

  // Al cambiar deportista: Cargar armas y préstamos
  useEffect(() => {
    if (selectedDeportista) {
      const fetchArmas = async () => {
        try {
          const res = await deportistaService.getDeportistaById(selectedDeportista);
          setMisArmas(res.data.armas || []);
          setMisPrestamos(res.data.prestamos_recibidos || []);
        } catch (err) { console.error(err); }
      };
      fetchArmas();
    }
  }, [selectedDeportista]);

  // Calcular Total Dinámico
  useEffect(() => {
      let sumaCat = 0;
      Object.keys(seleccion).forEach(catId => {
          const item = preciosCategorias.find(p => p.categoria_id === parseInt(catId));
          if(item) sumaCat += parseFloat(item.costo);
      });
      setTotalPagar(costoBase + sumaCat);
  }, [seleccion, costoBase, preciosCategorias]);

  const handleCategoriaToggle = (catId) => {
    setSeleccion(prev => {
      const newState = { ...prev };
      if (newState[catId] !== undefined) delete newState[catId];
      else newState[catId] = '';
      return newState;
    });
  };

  const handleArmaSelect = (catId, armaId) => {
    setSeleccion(prev => ({ ...prev, [catId]: armaId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompetencia || !selectedDeportista) return alert("Faltan datos.");
    if (Object.keys(seleccion).length === 0) return alert("Seleccione al menos una categoría.");

    const comp = competencias.find(c => c.id === parseInt(selectedCompetencia));
    if (new Date(comp.start_date).getFullYear() >= 2026) {
        if (Object.values(seleccion).some(id => !id)) return alert("Arma obligatoria para 2026.");
    }

    setSubmitting(true);
    
    const participacionesPayload = Object.entries(seleccion).map(([catId, armaId]) => ({
        categoria_id: parseInt(catId),
        arma_utilizada: armaId || null
    }));

    const payload = {
        competencia: selectedCompetencia,
        deportista: selectedDeportista,
        participaciones: participacionesPayload
    };

    try {
        await competenciaService.api.post('inscripcion/create/', payload);
        alert(`Proceso exitoso. Total registrado: ${totalPagar} Bs.`);
        navigate('/admin/inscripciones');
    } catch (err) {
        alert("Error: " + (err.response?.data?.detail || "Verifique los datos"));
    } finally {
        setSubmitting(false);
    }
  };

  const categoriasPorModalidad = preciosCategorias.reduce((acc, item) => {
      if(!acc[item.modalidad_name]) acc[item.modalidad_name] = [];
      acc[item.modalidad_name].push(item);
      return acc;
  }, {});
  
  const armasDisponibles = [
      ...misArmas.map(a => ({...a, origen: 'propia'})),
      ...misPrestamos.filter(p => p.competencia_id === parseInt(selectedCompetencia)).map(p => ({
          id: p.arma_id, marca: p.arma_marca, modelo: p.arma_modelo, calibre: p.arma_calibre, origen: 'prestamo', propietario: p.nombre_propietario
      }))
  ];
  
  const compYear = selectedCompetencia ? new Date(competencias.find(c => c.id === parseInt(selectedCompetencia))?.start_date).getFullYear() : null;

  if (loading) return <div className="text-center p-5">Cargando...</div>;

  return (
    <div className="container fade-in py-4">
      <div className="card-elegant mx-auto" style={{ maxWidth: '900px' }}>
        <div className={`card-header-elegant text-white ${inscripcionExistente ? 'bg-success' : 'bg-primary'}`}>
          <h4 className="m-0">
              {inscripcionExistente ? <><FaPlusCircle className="me-2"/> Adicionar Categorías</> : <><FaClipboardList className="me-2"/> Nueva Inscripción</>}
          </h4>
          <span className="badge bg-white text-dark fs-6 shadow-sm">Total: {totalPagar} Bs</span>
        </div>

        <div className="card-body p-4">
          {inscripcionExistente && (
              <div className="alert alert-success small mb-4 d-flex align-items-center">
                  <FaInfoCircle className="me-2"/> 
                  <div>
                      <strong>Deportista ya inscrito.</strong> 
                      <div className="small">Se sumarán las nuevas categorías a su cuenta.</div>
                  </div>
              </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* 1. DATOS GENERALES */}
            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <label className="small text-muted fw-bold">Competencia</label>
                    <select className="form-select" value={selectedCompetencia} onChange={e => setSelectedCompetencia(e.target.value)} required disabled={inscripcionExistente}>
                        <option value="">-- Seleccione --</option>
                        {competencias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-md-6">
                    <label className="small text-muted fw-bold">Deportista</label>
                    <select className="form-select" value={selectedDeportista} onChange={e => setSelectedDeportista(e.target.value)} required disabled={inscripcionExistente}>
                        <option value="">-- Seleccione --</option>
                        {deportistas.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.apellido_paterno} ({d.ci})</option>)}
                    </select>
                </div>
            </div>

            {selectedCompetencia && !inscripcionExistente && (
                <div className="alert alert-info py-2 mb-4 d-flex justify-content-between align-items-center">
                    <span className="small"><FaInfoCircle className="me-2"/> Derecho de Inscripción (Base)</span>
                    <strong>{costoBase} Bs</strong>
                </div>
            )}

            <hr className="my-4 opacity-10"/>

            {/* 2. LISTA DE CATEGORÍAS CON PRECIO */}
            <h5 className="fw-bold text-dark mb-3">Selección de Categorías</h5>
            
            {!selectedDeportista ? (
                <div className="text-center text-muted py-3">Seleccione un deportista para continuar.</div>
            ) : (
                Object.entries(categoriasPorModalidad).map(([modalidad, items]) => (
                    <div key={modalidad} className="mb-4">
                        <h6 className="text-primary border-bottom pb-2 mb-3 fw-bold text-uppercase small letter-spacing-1">{modalidad}</h6>
                        <div className="row g-3">
                            {items.map(item => {
                                const isSelected = seleccion[item.categoria_id] !== undefined;
                                const calibreReq = item.calibre_permitido;
                                
                                // Filtro de Armas por Calibre
                                const armasFiltradas = armasDisponibles.filter(a => {
                                    if (calibreReq) return a.calibre && a.calibre.toLowerCase().includes(calibreReq.toLowerCase());
                                    return true;
                                });

                                return (
                                    <div key={item.id} className="col-12">
                                        <div className={`p-3 rounded border transition-all ${isSelected ? 'border-success bg-success bg-opacity-10' : 'bg-white'}`}>
                                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                                
                                                {/* Checkbox y Precio */}
                                                <div className="form-check mb-0 d-flex align-items-center gap-2 flex-grow-1">
                                                    <input 
                                                        className="form-check-input" type="checkbox" 
                                                        checked={isSelected} 
                                                        onChange={() => handleCategoriaToggle(item.categoria_id)}
                                                        style={{transform: 'scale(1.3)'}}
                                                    />
                                                    <div>
                                                        <span className="d-block fw-bold text-dark">{item.categoria_name}</span>
                                                        <span className="badge bg-light text-dark border"><FaTag className="me-1 text-muted"/> {item.costo} Bs</span>
                                                    </div>
                                                </div>

                                                {/* Selector Arma (CON ICONOS INTEGRADOS) */}
                                                {isSelected && (
                                                    <div style={{width: '300px'}} className="d-flex align-items-center gap-2">
                                                        <FaCrosshairs className="text-muted"/>
                                                        <select 
                                                            className="form-select form-select-sm" 
                                                            value={seleccion[item.categoria_id]} 
                                                            onChange={(e) => handleArmaSelect(item.categoria_id, e.target.value)}
                                                            required={compYear >= 2026}
                                                        >
                                                            <option value="">{compYear >= 2026 ? 'Elegir Arma (Obligatorio)' : 'Sin Arma'}</option>
                                                            {armasFiltradas.length > 0 ? (
                                                                armasFiltradas.map(a => (
                                                                    <option key={a.id} value={a.id}>
                                                                        {a.origen === 'prestamo' ? '(PRESTADA) ' : ''}{a.marca} - {a.calibre}
                                                                    </option>
                                                                ))
                                                            ) : (
                                                                <option disabled>⚠️ No hay armas cal. {calibreReq}</option>
                                                            )}
                                                        </select>
                                                        {/* Indicador Visual de Préstamo */}
                                                        {armasDisponibles.find(a => String(a.id) === String(seleccion[item.categoria_id]))?.origen === 'prestamo' && (
                                                            <FaHandshake title="Arma Prestada" className="text-success"/>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            {/* PIE CON TOTAL (AQUÍ USAMOS EL ÍCONO FaMoneyBillWave) */}
            <div className="mt-4 p-4 bg-dark text-white rounded-4 d-flex justify-content-between align-items-center shadow">
                <div className="d-flex align-items-center gap-3">
                    <FaMoneyBillWave size={32} className="text-warning"/>
                    <div>
                        <small className="d-block opacity-75 text-uppercase">Total a Pagar</small>
                        <div className="display-6 fw-bold">{totalPagar} <span className="fs-4">Bs</span></div>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-light rounded-pill px-4" onClick={() => navigate(-1)}>Cancelar</button>
                    <button type="submit" className="btn btn-success rounded-pill px-5 fw-bold shadow-lg hover-scale" disabled={submitting}>
                        {submitting ? 'Procesando...' : <><FaSave className="me-2"/> Confirmar</>}
                    </button>
                </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterInscripcion;