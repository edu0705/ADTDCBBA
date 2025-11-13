import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';

// Rondas Estáticas de Muestra (Necesario para el selector)
const ROUND_OPTIONS = [
    'Ronda 1', 'Ronda 2', 'Semifinal', 'Final', 'Desempate', 'Serie 1', 'Serie 2'
];

const JudgePanel = () => {
    const [competencias, setCompetencias] = useState([]);
    const [inscripciones, setInscripciones] = useState([]);
    const [selectedCompetencia, setSelectedCompetencia] = useState('');
    const [rondaSeleccionada, setRondaSeleccionada] = useState('');
    const [puntajeCrudo, setPuntajeCrudo] = useState({}); 
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [modalidadSeleccionada, setModalidadSeleccionada] = useState(null);

    useEffect(() => {
        fetchCompetencias();
    }, []);

    const fetchCompetencias = async () => {
        try {
            // ¡CORREGIDO! Leemos los 'results' de la paginación
            const res = await competenciaService.getCompetencias();
            const data = (res.data && res.data.results) ? res.data.results : res.data;
            setCompetencias(data.filter(comp => comp.status !== 'Finalizada')); 
        } catch (err) {
            setError("No se pudieron cargar las competencias.");
        }
    };

    const fetchInscripciones = async (competenciaId) => {
        if (!competenciaId) {
            setInscripciones([]);
            return;
        }
        try {
            // ¡CORREGIDO! Leemos los 'results' de la paginación
            const resIns = await competenciaService.getInscripciones();
            const data = (resIns.data && resIns.data.results) ? resIns.data.results : resIns.data;
            
            const inscritos = data.filter(ins =>
                ins.competencia === parseInt(competenciaId) && ins.estado === 'APROBADA'
            );
            
            setInscripciones(inscritos);

            const initialScores = {};
            inscritos.forEach(ins => {
                // Inicializamos como un objeto vacío para los sub-campos
                initialScores[ins.id] = {};
            });
            setPuntajeCrudo(initialScores); // Inicializa el estado para el formulario
            setError('');

        } catch (err) {
            setError("Error al cargar la lista de competidores aprobados.");
        }
    };

    const handleCompetenciaChange = async (e) => {
        const id = e.target.value;
        setSelectedCompetencia(id);
        setRondaSeleccionada(''); 
        fetchInscripciones(id);

        const competencia = competencias.find(c => c.id === parseInt(id));
        if (competencia && competencia.categorias && competencia.categorias.length > 0) {
            const categoriaId = competencia.categorias[0]; 
            
            // ¡CORREGIDO! Leemos los 'results' de la paginación
            const modalidadesRes = await competenciaService.getModalidades();
            const data = (modalidadesRes.data && modalidadesRes.data.results) ? modalidadesRes.data.results : modalidadesRes.data;

            const modalidad = data.find(m => m.categorias.some(c => c.id === categoriaId));
            setModalidadSeleccionada(modalidad || null);
        } else {
            setModalidadSeleccionada(null);
        }
    };

    const handleRawScoreChange = (inscripcionId, field, value) => {
        // Permitir valores vacíos, pero convertir a 0 si se borra
        const numericValue = parseFloat(value);
        setPuntajeCrudo(prevData => ({
            ...prevData,
            [inscripcionId]: {
                ...prevData[inscripcionId],
                [field]: isNaN(numericValue) ? '' : numericValue
            }
        }));
    };
    
    const handleSubmitScore = async (inscripcionId) => {
        setMessage('');
        setError('');
        
        const scoreData = puntajeCrudo[inscripcionId]; 
        
        if (!rondaSeleccionada) {
            alert("Debe seleccionar una Ronda/Serie para ingresar el puntaje.");
            return;
        }
        if (!scoreData || Object.keys(scoreData).length === 0) {
            alert("Por favor ingrese algún dato de puntaje.");
            return;
        }

        try {
            await competenciaService.submitScore({
                inscripcion: parseInt(inscripcionId),
                puntaje_crudo: scoreData, 
                ronda_o_serie: rondaSeleccionada 
            });
            setMessage(`Puntaje registrado con éxito en la ronda ${rondaSeleccionada}.`);
            
            // Limpia los inputs para esa inscripción específica
            setPuntajeCrudo(prevData => ({
                ...prevData,
                [inscripcionId]: {}
            }));
            
        } catch (err) {
            const detail = (err.response && err.response.data) 
                ? JSON.stringify(err.response.data) 
                : 'Error de servidor';
            setError(`Fallo al enviar puntaje. Detalle: ${detail}`);
        }
    };
    
    const renderScoreForm = (inscripcionId) => {
        if (!modalidadSeleccionada) return <div className="text-muted">Seleccione una competencia con modalidades definidas.</div>;

        const data = puntajeCrudo[inscripcionId] || {};
        const fieldChange = (field, value) => handleRawScoreChange(inscripcionId, field, value);
        const modalidadName = modalidadSeleccionada.name.toUpperCase();

        // Lógica para FBI
        if (modalidadName.includes('FBI')) {
            return (
                <div className="row g-2">
                    <p className="text-muted small mt-2">FBI (Regla: Multiplicación por impacto)</p>
                    <div className="col-6"><input type="number" className="form-control" placeholder="Impactos de 5" value={data.impactos_5 || ''} onChange={(e) => fieldChange('impactos_5', e.target.value)} /></div>
                    <div className="col-6"><input type="number" className="form-control" placeholder="Impactos de 4" value={data.impactos_4 || ''} onChange={(e) => fieldChange('impactos_4', e.target.value)} /></div>
                    <div className="col-6"><input type="number" className="form-control" placeholder="Impactos de 3" value={data.impactos_3 || ''} onChange={(e) => fieldChange('impactos_3', e.target.value)} /></div>
                    <div className="col-6"><input type="number" className="form-control" placeholder="Impactos de 2" value={data.impactos_2 || ''} onChange={(e) => fieldChange('impactos_2', e.target.value)} /></div>
                </div>
            );
        }

        // Lógica para Silueta Metálica
        if (modalidadName.includes('SILUETA METÁLICA')) {
            return (
                <div className="row g-2">
                    <p className="text-muted small mt-2">SILUETA (Factores de 1, 1.5, 2, 2.5)</p>
                    <div className="col-6"><input type="number" className="form-control" placeholder="PÁJAROS (x1)" value={data.pajaros || ''} onChange={(e) => fieldChange('pajaros', e.target.value)} /></div>
                    <div className="col-6"><input type="number" className="form-control" placeholder="CHANCHOS (x1.5)" value={data.chanchos || ''} onChange={(e) => fieldChange('chanchos', e.target.value)} /></div>
                    <div className="col-6"><input type="number" className="form-control" placeholder="PAVAS (x2)" value={data.pavas || ''} onChange={(e) => fieldChange('pavas', e.target.value)} /></div>
                    <div className="col-6"><input type="number" className="form-control" placeholder="CARNEROS (x2.5)" value={data.carneros || ''} onChange={(e) => fieldChange('carneros', e.target.value)} /></div>
                </div>
            );
        }

        // --- ¡NUEVO BLOQUE DE LÓGICA! ---
        if (modalidadName.includes('BENCH REST')) {
            return (
                <div className="row g-2">
                    <p className="text-muted small mt-2">BENCH REST (Puntaje y X's)</p>
                    <div className="col-6">
                        <label className="form-label small">Puntuación (Max 250)</label>
                        <input type="number" className="form-control" placeholder="Puntaje"
                            value={data.puntuacion || ''}
                            onChange={(e) => fieldChange('puntuacion', e.target.value)} 
                            max="250"
                        />
                    </div>
                    <div className="col-6">
                        <label className="form-label small">Cantidad de X's</label>
                        <input type="number" className="form-control" placeholder="X's"
                            value={data.cantidad_x || ''}
                            onChange={(e) => fieldChange('cantidad_x', e.target.value)} 
                        />
                    </div>
                </div>
            );
        }

        // Lógica para ESCOPETA / HUNTER (Total de Impactos)
        if (modalidadName.includes('ESCOPETA') || modalidadName.includes('HUNTER')) {
             return (
                <input
                    type="number"
                    className="form-control"
                    placeholder="Total de Impactos"
                    value={data.total_impactos || ''}
                    onChange={(e) => fieldChange('total_impactos', e.target.value)}
                />
            );
        }

        // Lógica por Defecto (Ej: Chancho y Liebre, etc.)
        return (
            <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="Puntaje Total de Ronda"
                value={data.puntaje_total_ronda || ''}
                onChange={(e) => fieldChange('puntaje_total_ronda', e.target.value)}
            />
        );
    };

    const getArmaInfo = (inscripcion) => {
        if (inscripcion.participaciones && inscripcion.participaciones.length > 0) {
            const participacion = inscripcion.participaciones[0];
            if (participacion.arma_info) {
                return participacion.arma_info;
            }
        }
        return "N/A";
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Panel del Juez Avanzado</h2>
            
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="mb-3">
                <label className="form-label fw-bold">Seleccionar Competencia:</label>
                <select className="form-select" onChange={handleCompetenciaChange} value={selectedCompetencia}>
                    <option value="">-- Seleccione --</option>
                    {competencias.map(comp => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                </select>
            </div>
            
            {selectedCompetencia && (
                <div className="card p-3 mb-4 shadow-sm">
                    <p className="mb-2">Modalidad Activa: <strong className="text-primary">{modalidadSeleccionada ? modalidadSeleccionada.name : 'Cargando...'}</strong></p>
                    <label className="form-label fw-bold">Ronda/Serie a Calificar:</label>
                    <select className="form-select" value={rondaSeleccionada} onChange={(e) => setRondaSeleccionada(e.target.value)} required>
                        <option value="">-- Seleccione una Ronda --</option>
                        {ROUND_OPTIONS.map(ronda => (
                            <option key={ronda} value={ronda}>{ronda}</option>
                        ))}
                    </select>
                    {rondaSeleccionada && <p className="mt-2 text-info small">Calificando: {rondaSeleccionada}</p>}
                </div>
            )}

            {inscripciones.length > 0 && selectedCompetencia && (
                <div className="row">
                    <h3 className="mb-3">Competidores Aprobados ({inscripciones.length})</h3>
                    {inscripciones.map(ins => (
                        <div key={ins.id} className="col-md-6 mb-4">
                            <div className="card p-3 shadow-sm">
                                <h4 className="card-title h5">{ins.deportista}</h4> 
                                <p className="text-muted small">Arma: {getArmaInfo(ins)}</p>
                                
                                <div className="mb-3">
                                    {renderScoreForm(ins.id)}
                                </div>

                                <button 
                                    className="btn btn-success w-100"
                                    onClick={() => handleSubmitScore(ins.id)}
                                    disabled={!rondaSeleccionada}
                                >
                                    Enviar Puntaje ({rondaSeleccionada || 'Seleccione Ronda'})
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JudgePanel;