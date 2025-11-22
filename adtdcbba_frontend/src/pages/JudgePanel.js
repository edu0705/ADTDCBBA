import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';
import { 
  FaGavel, FaUser, FaCrosshairs, FaSave, FaStopwatch, 
  FaLayerGroup, FaTrophy, FaBullseye, FaCheck, FaTimes, FaExclamationTriangle 
} from 'react-icons/fa'; // <-- FaBullseye ELIMINADO

const ROUND_OPTIONS = ['Clasificación', 'Final', 'Desempate', 'Ronda 1', 'Ronda 2', 'Semifinal'];
const PLATO_LIMITS = { 'Ronda 1': 25, 'Ronda 2': 25, 'Semifinal': 10, 'Final': 5 };

const JudgePanel = () => {
    // --- ESTADOS DE DATOS ---
    const [competencias, setCompetencias] = useState([]);
    const [modalidades, setModalidades] = useState([]); // Nombre correcto: modalidades
    const [inscripciones, setInscripciones] = useState([]);
    
    // --- ESTADOS DE FILTRO ---
    const [selectedCompetencia, setSelectedCompetencia] = useState('');
    const [selectedModalidad, setSelectedModalidad] = useState('');
    const [selectedGrupo, setSelectedGrupo] = useState('1');
    const [rondaSeleccionada, setRondaSeleccionada] = useState('Final');
    
    // --- ESTADOS DE EDICIÓN ---
    const [puntajeCrudo, setPuntajeCrudo] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(null);
    
    // Estado de Descalificación
    const [isDqMode, setIsDqMode] = useState(false);
    const [dqReason, setDqReason] = useState('');

    // Estados Escopeta
    const [shotgunScores, setShotgunScores] = useState({});
    const [currentShooterIdx, setCurrentShooterIdx] = useState(0);
    const [currentPlato, setCurrentPlato] = useState(0);

    // 1. CARGA INICIAL
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const res = await competenciaService.getCompetencias();
                setCompetencias((res.data.results || res.data).filter(c => c.status !== 'Finalizada'));
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        loadInitial();
    }, []);

    // 2. CARGA AL SELECCIONAR COMPETENCIA
    useEffect(() => {
        if (!selectedCompetencia) return;
        const fetchData = async () => {
            try {
                const resInsc = await competenciaService.getInscripciones();
                const filtered = (resInsc.data.results || resInsc.data).filter(i => 
                    i.competencia === parseInt(selectedCompetencia) && i.estado === 'APROBADA'
                );
                setInscripciones(filtered);

                const modsMap = new Map();
                filtered.forEach(ins => ins.participaciones.forEach(p => modsMap.set(p.modalidad, p.modalidad_name)));
                const modsArr = Array.from(modsMap, ([id, name]) => ({ id, name }));
                setModalidades(modsArr);
                if (modsArr.length > 0) setSelectedModalidad(modsArr[0].id);
                
                setSelectedGrupo('1');
                
                // Inicializar Escopeta
                const initialSG = {};
                filtered.forEach(ins => initialSG[ins.id] = { r1:[], r2:[], semi:[], final:[] });
                setShotgunScores(initialSG);

            } catch (e) { console.error(e); }
        };
        fetchData();
    }, [selectedCompetencia]);

    // 3. FILTRO DE TIRADORES
    const tiradoresActivos = inscripciones.filter(ins => 
        ins.participaciones.some(p => p.modalidad === parseInt(selectedModalidad)) &&
        (selectedGrupo === 'Todos' || (ins.grupo || 1).toString() === selectedGrupo)
    ).sort((a, b) => (a.carril || 0) - (b.carril || 0));

    const gruposDisponibles = [...new Set(inscripciones.map(i => i.grupo || 1))].sort();

    // DETECTAR MODALIDAD
    const modName = modalidades.find(m => m.id === parseInt(selectedModalidad))?.name.toUpperCase() || '';
    const isShotgun = modName.includes('VUELO') || modName.includes('ESCOPETA') || modName.includes('TRAP') || modName.includes('HELICE');

    // --- MANEJO GENÉRICO ---
    const handleScoreChange = (id, field, value) => {
        setPuntajeCrudo(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleSubmitScore = async (id) => {
        if (isDqMode && !dqReason) return alert("Ingrese motivo de DQ.");
        if (!isDqMode && !rondaSeleccionada) return alert("Seleccione una Ronda.");
        
        const data = isDqMode ? {} : puntajeCrudo[id];
        if (!isDqMode && !data) return alert("Ingrese datos.");
        
        // Validación FBI
        if (!isDqMode && modName.includes('FBI') && !data.tiempo_r1) return alert("Tiempo R1 obligatorio.");

        setSending(id);
        try {
            const payload = {
                inscripcion: parseInt(id),
                ronda_o_serie: rondaSeleccionada,
                puntaje_crudo: data,
            };
            if (isDqMode) {
                 payload.es_descalificado = true; // Flag para el backend
                 payload.puntaje_crudo = { es_descalificado: true, motivo: dqReason }; // Respaldo en JSON
            }

            await competenciaService.submitScore(payload);
            alert(isDqMode ? "Tirador Descalificado." : "✅ Guardado.");
            setPuntajeCrudo(prev => { const s = {...prev}; delete s[id]; return s; });
            setIsDqMode(false); setDqReason('');
        } catch (e) { alert("Error al guardar."); } 
        finally { setSending(null); }
    };

    // --- MANEJO ESCOPETA ---
    const handleShotgunShot = (hit) => {
        if (tiradoresActivos.length === 0) return;
        const shooter = tiradoresActivos[currentShooterIdx];
        
        let rKey = 'r1';
        if(rondaSeleccionada.includes('2')) rKey = 'r2';
        if(rondaSeleccionada.includes('Semi')) rKey = 'semi';
        if(rondaSeleccionada.includes('Final')) rKey = 'final';

        setShotgunScores(prev => {
            const pScore = prev[shooter.id] || { r1:[], r2:[], semi:[], final:[] };
            const arr = [...(pScore[rKey] || [])];
            arr[currentPlato] = hit ? 1 : 0;
            return { ...prev, [shooter.id]: { ...pScore, [rKey]: arr } };
        });

        let nextIdx = currentShooterIdx + 1;
        let nextPlato = currentPlato;
        
        if (nextIdx >= tiradoresActivos.length) {
            nextIdx = 0;
            nextPlato++;
        }
        
        const limit = PLATO_LIMITS[rondaSeleccionada] || 25;
        if (nextPlato >= limit) {
            alert("Fin de la ronda. Guarde los resultados.");
            return;
        }

        setCurrentShooterIdx(nextIdx);
        setCurrentPlato(nextPlato);
    };

    const saveShotgunRound = async () => {
        if(!window.confirm("¿Guardar puntajes del grupo?")) return;
        setSending('GROUP');
        try {
            for(const ins of tiradoresActivos) {
                const data = shotgunScores[ins.id] || {};
                await competenciaService.submitScore({
                    inscripcion: ins.id,
                    puntaje_crudo: data,
                    ronda_o_serie: rondaSeleccionada
                });
            }
            alert("Grupo guardado.");
        } catch(e) { alert("Error guardando."); }
        finally { setSending(null); }
    };

    // --- RENDERIZADORES ---
    const renderGrid = (ins) => {
        let rKey = 'r1';
        if(rondaSeleccionada.includes('2')) rKey = 'r2';
        if(rondaSeleccionada.includes('Semi')) rKey = 'semi';
        if(rondaSeleccionada.includes('Final')) rKey = 'final';
        
        const arr = shotgunScores[ins.id]?.[rKey] || [];
        const limit = PLATO_LIMITS[rondaSeleccionada] || 25;

        return (
            <div className="d-flex gap-1 flex-wrap">
                {[...Array(limit)].map((_, idx) => {
                    const val = arr[idx];
                    let color = 'bg-light border';
                    if (val === 1) color = 'bg-success text-white border-success';
                    if (val === 0) color = 'bg-danger text-white border-danger';
                    const isActive = (idx === currentPlato && ins.id === tiradoresActivos[currentShooterIdx]?.id);
                    
                    return (
                        <div key={idx} className={`rounded-circle d-flex align-items-center justify-content-center small fw-bold ${color}`} 
                             style={{width: '20px', height: '20px', fontSize: '0.6rem', border: isActive ? '2px solid blue' : ''}}>
                            {val===1 ? '✓' : val===0 ? 'X' : idx+1}
                        </div>
                    );
                })}
            </div>
        );
    };

    // 1. PISTOLA MATCH
    const renderMatchForm = (id, data, handleChange) => {
        let total = 0;
        for(let i=1; i<=10; i++) total += ((parseInt(data[`lenta_${i}`])||0)*i) + ((parseInt(data[`rapida_${i}`])||0)*i);
        const renderRows = (prefix) => (
            [10,9,8,7,6,5,4,3,2,1].map(z => (
                <div key={z} className="d-flex justify-content-between mb-1 align-items-center">
                    <span className="badge bg-secondary" style={{width:'25px', fontSize:'0.7rem'}}>{z}</span>
                    <select className="form-select form-select-sm w-50 p-0 text-center" value={data[`${prefix}_${z}`]||''} onChange={e=>handleChange(`${prefix}_${z}`, e.target.value)}>
                        <option value="">0</option>{[...Array(11).keys()].slice(1).map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            ))
        );
        return (
            <div className="bg-light p-2 rounded border">
                <div className="row g-1">
                    <div className="col-6 border-end"><h6 className="text-center small fw-bold text-primary">LENTA</h6>{renderRows('lenta')}</div>
                    <div className="col-6"><h6 className="text-center small fw-bold text-danger">RÁPIDA</h6>{renderRows('rapida')}</div>
                </div>
                <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                    <div className="input-group input-group-sm" style={{width:'80px'}}><span className="input-group-text">Xs</span><input type="number" className="form-control" value={data.xs||''} onChange={e=>handleChange('xs', e.target.value)}/></div>
                    <h4 className="m-0 fw-bold text-dark">{total}</h4>
                </div>
                <div className="form-check mt-2 bg-white p-1 rounded border">
                    <input className="form-check-input ms-1" type="checkbox" id={`tie-${id}`} checked={!!data.ganador_desempate} onChange={e => handleChange('ganador_desempate', e.target.checked)}/>
                    <label className="form-check-label small fw-bold text-warning ms-2" htmlFor={`tie-${id}`}><FaTrophy/> Ganador Desempate</label>
                </div>
            </div>
        );
    };

    // 2. FBI
    const renderFBIForm = (id, data, handleChange) => {
        let pen = (parseInt(data.pen_r1)||0) + (parseInt(data.pen_r2)||0) + (parseInt(data.pen_r3)||0) + (parseInt(data.pen_r4)||0);
        return (
            <div className="bg-light p-3 rounded border">
                <div className="row g-2 mb-3">
                    <div className="col-12 bg-white p-2 rounded border border-primary">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="badge bg-primary">Ronda 1 (4s)</span>
                            <div className="input-group input-group-sm" style={{width:'100px'}}>
                                <span className="input-group-text"><FaStopwatch/></span>
                                <input type="number" step="0.01" className="form-control fw-bold" placeholder="0.00" value={data.tiempo_r1||''} onChange={e=>handleChange('tiempo_r1', e.target.value)} />
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 small">
                            <input type="checkbox" checked={!!data.check_r1} onChange={e=>handleChange('check_r1', e.target.checked)}/> 
                            <span className={data.check_r1 ? "text-danger fw-bold" : "text-muted"}>Fuera Tiempo</span>
                            {data.check_r1 && <input type="number" className="form-control form-control-sm border-danger p-0 text-center" style={{width:'40px'}} placeholder="#" value={data.pen_r1||''} onChange={e=>handleChange('pen_r1', e.target.value)}/>}
                        </div>
                    </div>
                    {[2,3,4].map(r => (
                        <div key={r} className="col-4 text-center p-1 bg-white rounded border">
                            <small className="d-block fw-bold text-muted mb-1">R{r}</small>
                            <input type="checkbox" checked={!!data[`check_r${r}`]} onChange={e=>handleChange(`check_r${r}`, e.target.checked)}/>
                            {data[`check_r${r}`] && <input type="number" className="form-control form-control-sm mt-1 text-center border-danger p-0" placeholder="#" value={data[`pen_r${r}`]||''} onChange={e=>handleChange(`pen_r${r}`, e.target.value)}/>}
                        </div>
                    ))}
                </div>
                <div className="text-end small text-danger fw-bold mb-2">Penalización: -{pen} tiros</div>
                <h6 className="small fw-bold text-center text-muted border-bottom">IMPACTOS</h6>
                <div className="row g-1 justify-content-center">
                    {[5,4,3,2,1,0].map(z => (
                        <div key={z} className="col-2 text-center">
                            <label className={`badge w-100 ${z===5?'bg-warning text-dark':'bg-secondary'}`}>{z}</label>
                            <select className="form-select form-select-sm p-0 text-center" value={data[`zona_${z}`]||''} onChange={e=>handleChange(`zona_${z}`, e.target.value)}>
                                <option value="">0</option>{[...Array(21).keys()].slice(1).map(n=><option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 3. SILUETAS
    const renderSiluetaForm = (id, data, handleChange) => {
        const total = ((parseInt(data.carril_1)||0)+(parseInt(data.carril_5)||0))*1 + ((parseInt(data.carril_2)||0)+(parseInt(data.carril_6)||0))*1.5 + ((parseInt(data.carril_3)||0)+(parseInt(data.carril_7)||0))*2 + ((parseInt(data.carril_4)||0)+(parseInt(data.carril_8)||0))*2.5;
        const renderInput = (n, lbl, col) => (
            <div className="col-3 p-1 text-center">
                <div className={`border rounded p-1 ${col} bg-opacity-10`}>
                    <small className="d-block fw-bold" style={{fontSize:'0.6rem'}}>{lbl}</small>
                    <select className="form-select form-select-sm p-0 text-center fw-bold" value={data[`carril_${n}`]||''} onChange={e=>handleChange(`carril_${n}`, e.target.value)}><option value="">-</option>{[0,1,2,3,4,5].map(x=><option key={x} value={x}>{x}</option>)}</select>
                </div>
            </div>
        );
        return (
            <div className="bg-white p-3 rounded border shadow-sm">
                <div className="row g-1 mb-2">{renderInput(1,"Pájaro", "bg-info")}{renderInput(2,"Chancho", "bg-success")}{renderInput(3,"Pava", "bg-warning")}{renderInput(4,"Carnero", "bg-danger")}</div>
                <div className="row g-1 mb-2">{renderInput(5,"Pájaro", "bg-info")}{renderInput(6,"Chancho", "bg-success")}{renderInput(7,"Pava", "bg-warning")}{renderInput(8,"Carnero", "bg-danger")}</div>
                <div className="d-flex justify-content-between align-items-center border-top pt-2">
                     <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`tie-${id}`} checked={!!data.ganador_desempate} onChange={e => handleChange('ganador_desempate', e.target.checked)}/>
                        <label className="form-check-label small fw-bold text-warning" htmlFor={`tie-${id}`}><FaTrophy/> Ganador</label>
                    </div>
                    <span className="h5 fw-bold m-0">{total.toFixed(1)}</span>
                </div>
            </div>
        );
    };

    // 4. LIEBRE
    const renderLiebreForm = (id, data, handleChange) => {
        let tL = 0, tJ = 0;
        for(let i=5; i>=0; i--) { tL += (parseInt(data[`liebre_${i}`])||0)*i; tJ += (parseInt(data[`jabali_${i}`])||0)*i; }
        const renderRow = (pre, lbl) => (
            <div className="d-flex gap-1 mb-1 align-items-center">
                <span className="badge bg-secondary w-25">{lbl}</span>
                {[5,4,3,2,1,0].map(z => <select key={z} className="form-select form-select-sm p-0 text-center" value={data[`${pre}_${z}`]||''} onChange={e=>handleChange(`${pre}_${z}`, e.target.value)}><option value="">0</option>{[...Array(11).keys()].slice(1).map(n=><option key={n} value={n}>{n}</option>)}</select>)}
            </div>
        );
        return (
            <div className="bg-light p-2 rounded border">
                {renderRow('liebre', 'Liebre')}
                {renderRow('jabali', 'Jabalí')}
                <div className="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
                     <div className="input-group input-group-sm w-25"><span className="input-group-text bg-warning">Xs</span><input type="number" className="form-control" value={data.xs||''} onChange={e=>handleChange('xs', e.target.value)}/></div>
                     <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`tie-${id}`} checked={!!data.ganador_desempate} onChange={e => handleChange('ganador_desempate', e.target.checked)}/>
                        <label className="form-check-label small text-warning" htmlFor={`tie-${id}`}><FaTrophy/></label>
                    </div>
                     <span className="h5 fw-bold m-0">{tL+tJ}</span>
                </div>
            </div>
        );
    };

    // 5. IPSC
    const renderIPSCForm = (id, data, handleChange) => (
        <div className="bg-light p-3 rounded border text-center">
            <h6 className="small fw-bold text-primary">RESULTADOS IPSC</h6>
            <div className="row g-2 justify-content-center">
                <div className="col-6"><label className="small text-muted">Match Points</label><input type="number" step="0.0001" className="form-control fw-bold text-center" value={data.match_points||''} onChange={e=>handleChange('match_points', e.target.value)}/></div>
                <div className="col-6"><label className="small text-muted">Percentage %</label><input type="number" step="0.01" className="form-control fw-bold text-center" value={data.match_percent||''} onChange={e=>handleChange('match_percent', e.target.value)}/></div>
            </div>
        </div>
    );

    // 6. ESTÁNDAR
    const renderStandardForm = (id, data, handleChange) => (
        <div className="bg-light p-3 rounded border">
            <div className="row g-2 mb-2">
                <div className="col-8"><label className="small fw-bold text-primary">TOTAL</label><input type="number" step="0.01" className="form-control form-control-lg text-center fw-bold fs-3" value={data.puntaje_total_ronda||''} onChange={e=>handleChange('puntaje_total_ronda', e.target.value)} inputMode="decimal"/></div>
                <div className="col-4"><label className="small fw-bold text-secondary">Xs</label><input type="number" className="form-control form-control-lg text-center fw-bold fs-3" value={data.xs||''} onChange={e=>handleChange('xs', e.target.value)} inputMode="numeric"/></div>
            </div>
            <div className="form-check bg-white p-2 rounded border">
                <input className="form-check-input ms-1" type="checkbox" id={`tie-${id}`} checked={!!data.ganador_desempate} onChange={e => handleChange('ganador_desempate', e.target.checked)}/>
                <label className="form-check-label small fw-bold text-warning ms-2" htmlFor={`tie-${id}`}><FaTrophy/> Ganador Desempate Manual</label>
            </div>
        </div>
    );

    // --- SELECTOR MAESTRO ---
    const renderForm = (id, modName) => {
        const data = puntajeCrudo[id] || {};
        const handleChange = (f, v) => handleScoreChange(id, f, v);
        const name = modName.toUpperCase();

        if (name.includes('FBI')) return renderFBIForm(id, data, handleChange);
        if (name.includes('MATCH') || name.includes('PISTOLA')) {
            if(name.includes('OLIMPICA') || name.includes('OLÍMPICA')) return renderStandardForm(id, data, handleChange);
            return renderMatchForm(id, data, handleChange);
        }
        if (name.includes('SILUETA') || name.includes('METALICA')) return renderSiluetaForm(id, data, handleChange);
        if (name.includes('LIEBRE') || name.includes('JABALI')) return renderLiebreForm(id, data, handleChange);
        if (name.includes('IPSC') || name.includes('PRACTICO')) return renderIPSCForm(id, data, handleChange);
        
        // Default (Bench Rest, Carabina, Hunter)
        return renderStandardForm(id, data, handleChange);
    };

    const getArmaDetails = (inscripcion) => {
        const part = inscripcion.participaciones.find(p => p.modalidad === parseInt(selectedModalidad));
        return (part && part.arma_info) ? `${part.arma_info} (${part.arma_calibre})` : "Sin Arma";
    };

    if (loading) return <div className="text-center p-5">Cargando panel...</div>;

    return (
        <div className="container fade-in pb-5">
            <div className="d-flex align-items-center gap-3 mb-4 mt-3">
                <div className="bg-dark text-white p-3 rounded-circle shadow"><FaGavel size={24}/></div>
                <div><h2 className="fw-bold text-dark m-0">Panel de Juez</h2><p className="text-muted m-0 small">Calificación Oficial</p></div>
            </div>

            {/* Filtros */}
            <div className="card-elegant mb-4 p-4 bg-primary text-white" style={{background: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 100%)'}}>
                <div className="row g-3 align-items-end">
                    <div className="col-md-4"><label className="small opacity-75">Competencia</label><select className="form-select border-0" value={selectedCompetencia} onChange={e => setSelectedCompetencia(e.target.value)}><option value="">-- Seleccionar --</option>{competencias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="col-md-4"><label className="small opacity-75">Modalidad</label><select className="form-select border-0" value={selectedModalidad} onChange={e => setSelectedModalidad(e.target.value)} disabled={!selectedCompetencia}>{modalidades.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                    <div className="col-md-2"><label className="small opacity-75"><FaLayerGroup className="me-1"/> Grupo</label><select className="form-select border-0 fw-bold text-primary" value={selectedGrupo} onChange={e => setSelectedGrupo(e.target.value)}><option value="Todos">Todos</option>{gruposDisponibles.map(g => <option key={g} value={g.toString()}>G{g}</option>)}</select></div>
                    <div className="col-md-2"><label className="small opacity-75">Ronda</label><select className="form-select border-0" value={rondaSeleccionada} onChange={e => {setRondaSeleccionada(e.target.value); setCurrentPlato(0); setCurrentShooterIdx(0);}}>{isShotgun ? ['Ronda 1','Ronda 2','Semifinal','Final'].map(r=><option key={r} value={r}>{r}</option>) : ROUND_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                </div>
            </div>

            {/* VISTA DE ESCOPETA (SQUAD) */}
            {isShotgun && tiradoresActivos.length > 0 ? (
                <div className="row">
                    <div className="col-12 mb-4 sticky-top" style={{zIndex: 1020, top: '10px'}}>
                        <div className="card border-0 shadow-lg bg-dark text-white rounded-4">
                            <div className="card-body text-center">
                                <h5 className="text-warning mb-2">TIRADOR ACTUAL:</h5>
                                <h2 className="fw-bold mb-4" style={{fontSize: '2.5rem'}}>{tiradoresActivos[currentShooterIdx]?.deportista_nombre}</h2>
                                <div className="d-flex justify-content-center gap-4">
                                    <button className="btn btn-success btn-lg rounded-circle p-4 shadow-lg" style={{width:'100px',height:'100px'}} onClick={() => handleShotgunShot(true)}><FaCheck size={40}/></button>
                                    <button className="btn btn-danger btn-lg rounded-circle p-4 shadow-lg" style={{width:'100px',height:'100px'}} onClick={() => handleShotgunShot(false)}><FaTimes size={40}/></button>
                                </div>
                                <div className="mt-3 small text-muted">Plato {currentPlato + 1}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12"><div className="card border-0 shadow-sm rounded-4"><div className="card-header bg-white border-0 py-3"><h5 className="fw-bold m-0 text-primary"><FaLayerGroup className="me-2"/> Planilla - Grupo {selectedGrupo}</h5></div><div className="table-responsive"><table className="table align-middle mb-0"><thead className="bg-light"><tr><th>Deportista</th><th>Grilla</th><th className="text-center">Total</th></tr></thead><tbody>{tiradoresActivos.map((ins, idx) => {const rKey = rondaSeleccionada.includes('2') ? 'r2' : rondaSeleccionada.includes('Semi') ? 'semi' : rondaSeleccionada.includes('Final') ? 'final' : 'r1'; const score = (shotgunScores[ins.id]?.[rKey] || []).reduce((a,b)=>a+b, 0); return (<tr key={ins.id} className={idx === currentShooterIdx ? 'table-active border-start border-5 border-primary' : ''}><td className="fw-bold">{ins.deportista_nombre} {ins.deportista_apellido}</td><td>{renderGrid(ins)}</td><td className="text-center fw-bold fs-5">{score}</td></tr>);})}</tbody></table></div><div className="card-footer bg-white border-0 p-3"><button className="btn btn-primary w-100 rounded-pill fw-bold" onClick={saveShotgunRound}><FaSave className="me-2"/> Guardar Ronda</button></div></div></div>
                </div>
            ) : (
                /* VISTA ESTÁNDAR (TARJETAS) */
                <div className="row">
                    {(!selectedCompetencia || !selectedModalidad) && <div className="col-12 text-center text-muted py-5"><FaBullseye size={40} className="mb-3 opacity-25"/><h5>Seleccione filtros para comenzar</h5></div>}
                    
                    {selectedCompetencia && selectedModalidad && tiradoresActivos.length === 0 && <div className="col-12 text-center py-5 text-muted">No hay inscritos en este grupo.</div>}

                    {tiradoresActivos.map(ins => (
                        <div key={ins.id} className="col-md-6 col-xl-4 mb-4">
                            <div className="card border-0 shadow-sm h-100 rounded-4">
                                <div className="card-body">
                                    <div className="d-flex gap-3 align-items-center mb-3">
                                        <div className="bg-light p-2 rounded-circle"><FaUser size={20}/></div>
                                        <div className="overflow-hidden"><h6 className="fw-bold m-0 text-truncate">{ins.deportista_nombre} {ins.deportista_apellido}</h6><small className="text-muted">{ins.club_nombre}</small></div>
                                    </div>
                                    <div className="small text-muted mb-3 border-bottom pb-2"><FaCrosshairs/> {getArmaDetails(ins)}</div>
                                    
                                    {renderForm(ins.id, modalidades.find(m=>m.id===parseInt(selectedModalidad))?.name || '')}

                                    <div className="d-flex gap-2 mt-3">
                                        <button className="btn btn-success w-100 rounded-pill fw-bold shadow-sm" onClick={() => handleSubmitScore(ins.id)} disabled={sending===ins.id}>{sending===ins.id ? '...' : <><FaSave/> Guardar</>}</button>
                                        
                                        {/* BOTÓN DESCALIFICAR */}
                                        <button className={`btn btn-sm ${isDqMode?'btn-danger':'btn-outline-secondary'} rounded-circle`} title="Descalificar" onClick={()=>{setIsDqMode(!isDqMode); setDqReason('');}}><FaExclamationTriangle/></button>
                                    </div>

                                    {isDqMode && <div className="mt-2 bg-danger bg-opacity-10 p-2 rounded"><textarea className="form-control form-control-sm mb-1" placeholder="Motivo DQ" value={dqReason} onChange={e=>setDqReason(e.target.value)}></textarea><button className="btn btn-danger btn-sm w-100" onClick={()=>handleSubmitScore(ins.id)}>CONFIRMAR DQ</button></div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JudgePanel;