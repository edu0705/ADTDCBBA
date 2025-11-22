import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import competenciaService from '../services/competenciaService';
import { FaSave, FaTrophy, FaList, FaGavel, FaMoneyBillWave, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const CreateCompetencia = () => {
  const navigate = useNavigate();
  
  // Datos Maestros
  const [poligonos, setPoligonos] = useState([]);
  const [modalidades, setModalidades] = useState([]); // Incluye categorías anidadas
  const [jueces, setJueces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado del Asistente (Wizard)
  const [step, setStep] = useState(1);
  
  // Datos del Formulario General
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    type: 'Departamental',
    poligono: '',
    costo_inscripcion_base: 0, // NUEVO: Costo general de entrada
    status: 'Próxima'
  });

  // Configuración de Categorías y Precios
  // Estructura: { categoriaId: { selected: true, costo: 0 } }
  const [catConfig, setCatConfig] = useState({});
  
  // Selección de Jueces
  const [selectedJueces, setSelectedJueces] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resPol, resMod, resJuez] = await Promise.all([
            competenciaService.api.get('poligonos/'),
            competenciaService.getModalidades(),
            competenciaService.api.get('jueces/')
        ]);
        setPoligonos(resPol.data.results || resPol.data);
        setModalidades(resMod.data.results || resMod.data);
        setJueces(resJuez.data.results || resJuez.data);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleJuez = (id) => {
      setSelectedJueces(prev => prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]);
  };

  const toggleCategoria = (catId) => {
      setCatConfig(prev => {
          const newState = { ...prev };
          if (newState[catId]) delete newState[catId]; // Desmarcar
          else newState[catId] = { selected: true, costo: 0 }; // Marcar (Precio 0 por defecto)
          return newState;
      });
  };

  const updateCostoCategoria = (catId, nuevoCosto) => {
      setCatConfig(prev => ({
          ...prev,
          [catId]: { ...prev[catId], costo: parseFloat(nuevoCosto) || 0 }
      }));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      // 1. Preparar lista de IDs de categorías
      const categoriasIds = Object.keys(catConfig).map(id => parseInt(id));
      
      // 2. Preparar estructura de precios para el Serializer
      // El backend espera 'precios_input' = [{id: 1, costo: 50}, ...]
      const preciosPayload = Object.entries(catConfig).map(([id, conf]) => ({
          id: parseInt(id),
          costo: conf.costo
      }));

      const payload = {
          ...formData,
          jueces: selectedJueces,
          categorias: categoriasIds,
          precios_input: preciosPayload // Enviamos la configuración de precios
      };

      try {
          await competenciaService.api.post('competencias/', payload);
          alert("Competencia creada y configurada con éxito.");
          navigate('/admin/competencias');
      } catch (err) {
          console.error(err);
          alert("Error al crear la competencia. Revise los datos.");
      }
  };

  if (loading) return <div className="text-center p-5">Cargando configuración...</div>;

  return (
    <div className="container fade-in py-4">
      <div className="card-elegant mx-auto" style={{ maxWidth: '900px' }}>
        
        {/* HEADER DEL WIZARD */}
        <div className="card-header-elegant bg-white p-4 border-bottom">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="m-0 fw-bold text-primary">Nueva Competencia</h4>
                <span className="badge bg-light text-dark border">Paso {step} de 3</span>
            </div>
            <div className="progress" style={{height: '5px'}}>
                <div className="progress-bar" style={{width: `${(step/3)*100}%`}}></div>
            </div>
        </div>

        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            
            {/* --- PASO 1: DATOS GENERALES --- */}
            {step === 1 && (
                <div className="fade-in">
                    <h5 className="fw-bold text-dark mb-4"><FaTrophy className="me-2"/> Información General</h5>
                    <div className="row g-3">
                        <div className="col-12">
                            <label className="small fw-bold text-muted">Nombre del Evento</label>
                            <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Ej: Copa Apertura 2026" />
                        </div>
                        <div className="col-md-6">
                            <label className="small fw-bold text-muted">Fecha Inicio</label>
                            <input type="date" className="form-control" name="start_date" value={formData.start_date} onChange={handleInputChange} required />
                        </div>
                        <div className="col-md-6">
                            <label className="small fw-bold text-muted">Fecha Fin</label>
                            <input type="date" className="form-control" name="end_date" value={formData.end_date} onChange={handleInputChange} required />
                        </div>
                        <div className="col-md-6">
                            <label className="small fw-bold text-muted">Tipo</label>
                            <select className="form-select" name="type" value={formData.type} onChange={handleInputChange}>
                                <option>Departamental</option>
                                <option>Nacional</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="small fw-bold text-muted">Polígono (Sede)</label>
                            <select className="form-select" name="poligono" value={formData.poligono} onChange={handleInputChange} required>
                                <option value="">-- Seleccione --</option>
                                {poligonos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PASO 2: FINANZAS Y CATEGORÍAS --- */}
            {step === 2 && (
                <div className="fade-in">
                    <h5 className="fw-bold text-dark mb-4"><FaMoneyBillWave className="me-2"/> Categorías y Precios</h5>
                    
                    {/* Costo Base Global */}
                    <div className="bg-light p-3 rounded border mb-4">
                        <label className="fw-bold text-primary small d-block mb-2">Costo de Inscripción Base (Derecho de Campo)</label>
                        <div className="input-group" style={{maxWidth: '200px'}}>
                            <span className="input-group-text">Bs</span>
                            <input type="number" className="form-control fw-bold" name="costo_inscripcion_base" value={formData.costo_inscripcion_base} onChange={handleInputChange} />
                        </div>
                        <small className="text-muted">Este monto se cobra una sola vez por deportista al inscribirse.</small>
                    </div>

                    {/* Selección de Categorías y sus Precios */}
                    <label className="fw-bold text-dark small mb-2 d-block">Seleccione categorías habilitadas y defina sus costos:</label>
                    <div className="accordion" id="accordionModalidades">
                        {modalidades.map((mod, idx) => (
                            <div className="accordion-item border-0 mb-2 shadow-sm rounded overflow-hidden" key={mod.id}>
                                <h2 className="accordion-header">
                                    <button className="accordion-button collapsed bg-white text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${idx}`}>
                                        <FaList className="me-2 text-secondary"/> {mod.name}
                                    </button>
                                </h2>
                                <div id={`collapse${idx}`} className="accordion-collapse collapse" data-bs-parent="#accordionModalidades">
                                    <div className="accordion-body bg-light">
                                        {mod.categorias.map(cat => (
                                            <div key={cat.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" type="checkbox" 
                                                        id={`cat-${cat.id}`}
                                                        checked={!!catConfig[cat.id]}
                                                        onChange={() => toggleCategoria(cat.id)}
                                                        style={{cursor: 'pointer'}}
                                                    />
                                                    <label className="form-check-label cursor-pointer" htmlFor={`cat-${cat.id}`}>{cat.name}</label>
                                                </div>
                                                
                                                {/* Input de Precio (Solo aparece si está seleccionado) */}
                                                {catConfig[cat.id] && (
                                                    <div className="input-group input-group-sm fade-in" style={{width: '130px'}}>
                                                        <span className="input-group-text bg-white text-success fw-bold border-end-0">Bs</span>
                                                        <input 
                                                            type="number" className="form-control text-end border-start-0" 
                                                            placeholder="0"
                                                            value={catConfig[cat.id].costo}
                                                            onChange={(e) => updateCostoCategoria(cat.id, e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- PASO 3: JUECES --- */}
            {step === 3 && (
                <div className="fade-in">
                    <h5 className="fw-bold text-dark mb-4"><FaGavel className="me-2"/> Asignación de Jueces</h5>
                    <p className="text-muted small">Seleccione los jueces autorizados para calificar en este evento.</p>
                    
                    <div className="row">
                        {jueces.map(juez => (
                            <div key={juez.id} className="col-md-6 mb-2">
                                <div className={`p-3 rounded border d-flex align-items-center gap-3 cursor-pointer transition-all ${selectedJueces.includes(juez.id) ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                                     onClick={() => toggleJuez(juez.id)}>
                                    <div className={`rounded-circle p-1 ${selectedJueces.includes(juez.id) ? 'bg-primary' : 'bg-secondary'}`}></div>
                                    <div>
                                        <strong className="d-block text-dark">{juez.full_name}</strong>
                                        <small className="text-muted">{juez.license_number}</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                {step > 1 ? (
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setStep(step - 1)}>
                        <FaArrowLeft className="me-2"/> Anterior
                    </button>
                ) : (
                    <div></div> // Espaciador para alinear a la derecha
                )}

                {step < 3 ? (
                    <button type="button" className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setStep(step + 1)}>
                        Siguiente <FaArrowRight className="ms-2"/>
                    </button>
                ) : (
                    <button type="submit" className="btn btn-success rounded-pill px-5 fw-bold shadow-lg hover-scale">
                        <FaSave className="me-2"/> Crear Competencia
                    </button>
                )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCompetencia;