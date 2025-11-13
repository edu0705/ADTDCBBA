// src/pages/RegisterInscripcion.js

import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';
import deportistaService from '../services/deportistaService';

const RegisterInscripcion = () => {
    // Listas de datos cargados
    const [competencias, setCompetencias] = useState([]);
    const [deportistas, setDeportistas] = useState([]); // Deportistas del club
    const [allModalidades, setAllModalidades] = useState([]);
    const [deportistaArmas, setDeportistaArmas] = useState([]); // Armas propias

    // Datos del formulario principal
    const [selectedCompetencia, setSelectedCompetencia] = useState('');
    const [selectedDeportista, setSelectedDeportista] = useState('');
    
    // Estado para construir las participaciones
    const [participaciones, setParticipaciones] = useState([]);
    const [currentModalidad, setCurrentModalidad] = useState('');
    const [currentArma, setCurrentArma] = useState(''); // ID del arma seleccionada (propia o prestada)

    // ¡NUEVA LÓGICA DE PRÉSTAMO!
    const [isArmaPrestada, setIsArmaPrestada] = useState(false);
    const [selectedLender, setSelectedLender] = useState(''); // ID del deportista prestamista
    const [lenderArmas, setLenderArmas] = useState([]); // Armas del prestamista

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // 1. Carga inicial de datos
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [competenciasRes, deportistasRes, modalidadesRes] = await Promise.all([
                    competenciaService.getCompetencias(),
                    deportistaService.getDeportistas(), 
                    competenciaService.getModalidades()
                ]);
                
                // Helper para extraer datos paginados
                const extractData = (res) => (res.data && res.data.results) ? res.data.results : res.data;

                setCompetencias(extractData(competenciasRes).filter(c => c.status !== 'Finalizada'));
                setDeportistas(extractData(deportistasRes).filter(d => d.status === 'Activo'));
                setAllModalidades(extractData(modalidadesRes));

            } catch (err) {
                setError("No se pudieron cargar los datos necesarios para la inscripción.");
            }
        };
        fetchData();
    }, []);

    // 2. Efecto dinámico: Cargar armas PROPIAS
    useEffect(() => {
        if (!selectedDeportista) {
            setDeportistaArmas([]);
            return;
        }
        // Resetea el formulario de préstamo si el deportista principal cambia
        setIsArmaPrestada(false); 
        setSelectedLender('');
        setLenderArmas([]);

        const fetchDeportistaArmas = async () => {
            try {
                const res = await deportistaService.getDeportistaDetail(selectedDeportista);
                setDeportistaArmas(res.data.armas || []);
            } catch (err) {
                setError("Error al cargar las armas del deportista.");
            }
        };
        fetchDeportistaArmas();
    }, [selectedDeportista]); 

    // 3. ¡NUEVO EFECTO! Cargar armas PRESTADAS cuando el prestamista cambia
    useEffect(() => {
        if (!isArmaPrestada || !selectedLender) {
            setLenderArmas([]);
            return;
        }
        const fetchLenderArmas = async () => {
             try {
                const res = await deportistaService.getDeportistaDetail(selectedLender);
                setLenderArmas(res.data.armas || []);
            } catch (err) {
                setError("Error al cargar las armas del prestamista.");
            }
        };
        fetchLenderArmas();
    }, [isArmaPrestada, selectedLender]);

    // 4. Lógica para añadir una participación a la lista
    const handleAddParticipacion = () => {
        if (!currentModalidad || !currentArma) {
            alert("Debe seleccionar una modalidad y un arma para añadir.");
            return;
        }

        const modObj = allModalidades.find(m => m.id === parseInt(currentModalidad));
        
        // ¡LÓGICA MEJORADA! Busca el arma en la lista correcta
        const armaObj = isArmaPrestada 
            ? lenderArmas.find(a => a.id === parseInt(currentArma))
            : deportistaArmas.find(a => a.id === parseInt(currentArma));

        const newParticipacion = {
            modalidad: parseInt(currentModalidad),
            arma_utilizada: parseInt(currentArma),
            modalidad_name: modObj ? modObj.name : 'N/A',
            arma_name: armaObj ? `${armaObj.marca} ${armaObj.modelo} ${isArmaPrestada ? '(Prestada)' : ''}` : 'N/A'
        };

        setParticipaciones([...participaciones, newParticipacion]);
        setCurrentModalidad('');
        setCurrentArma('');
    };

    // 5. Lógica de envío (sin cambios, el backend solo necesita el ID del arma)
    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (misma lógica de handleSubmit que ya tenías) ...
        setMessage(''); setError('');

        if (!selectedCompetencia || !selectedDeportista || participaciones.length === 0) {
            setError("Debe seleccionar una competencia, un deportista y añadir al menos una participación.");
            return;
        }

        const dataToSend = {
            deportista: parseInt(selectedDeportista),
            competencia: parseInt(selectedCompetencia),
            participaciones: participaciones.map(p => ({
                modalidad: p.modalidad,
                arma_utilizada: p.arma_utilizada
            }))
        };

        try {
            await competenciaService.createInscripcion(dataToSend);
            setMessage("Inscripción enviada con éxito. Pendiente de aprobación.");
            
            setSelectedCompetencia('');
            setSelectedDeportista('');
            setParticipaciones([]);
            setDeportistaArmas([]);
            setIsArmaPrestada(false);
            setSelectedLender('');

        } catch (err) {
            console.error("Error al crear inscripción:", err.response.data);
            const errorMsg = err.response.data.detail || JSON.stringify(err.response.data);
            setError(`Error al crear inscripción: ${errorMsg}`);
        }
    };

    // --- RENDERIZADO ---
    return (
        <div className="container mt-4">
            <h2 className="text-primary mb-4">Registrar Inscripción a Competencia</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="card shadow-sm p-4">
                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {/* ... (Sección 1: Datos Generales - sin cambios) ... */}
                    <h4 className="text-secondary border-bottom pb-2">1. Datos Generales</h4>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Competencia (Solo activas)</label>
                            <select name="competencia" className="form-select" onChange={(e) => setSelectedCompetencia(e.target.value)} value={selectedCompetencia} required>
                                <option value="">Seleccione una Competencia</option>
                                {competencias.map(comp => (
                                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Deportista (Solo activos)</label>
                            <select name="deportista" className="form-select" onChange={(e) => setSelectedDeportista(e.target.value)} value={selectedDeportista} required>
                                <option value="">Seleccione un Deportista</option>
                                {deportistas.map(dep => (
                                    <option key={dep.id} value={dep.id}>{dep.first_name} {dep.last_name} (CI: {dep.ci})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <h4 className="text-secondary border-bottom pb-2 mt-5">2. Añadir Participaciones (Modalidades)</h4>
                    
                    {/* Esta sección solo se activa si se seleccionó un deportista */}
                    {selectedDeportista && (
                        <div className="p-3 bg-light rounded border">
                            {/* Selector de Modalidad (común) */}
                            <div className="row g-3">
                                <div className="col-md-10">
                                    <label className="form-label">Modalidad</label>
                                    <select className="form-select" value={currentModalidad} onChange={(e) => setCurrentModalidad(e.target.value)}>
                                        <option value="">Seleccione Modalidad</option>
                                        {allModalidades.map(mod => (
                                            <option key={mod.id} value={mod.id}>{mod.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button type="button" onClick={handleAddParticipacion} className="btn btn-success w-100">
                                        <i className="bi bi-plus-circle"></i> Añadir
                                    </button>
                                </div>
                            </div>
                            
                            {/* ¡NUEVO! Checkbox de Préstamo */}
                            <div className="form-check mt-3">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id="prestamoCheck"
                                    checked={isArmaPrestada}
                                    onChange={(e) => {
                                        setIsArmaPrestada(e.target.checked);
                                        setSelectedLender('');
                                        setCurrentArma('');
                                    }}
                                />
                                <label className="form-check-label" htmlFor="prestamoCheck">
                                    Usar Arma Prestada
                                </label>
                            </div>

                            {/* ¡NUEVO! Selectores de Arma Condicionales */}
                            {!isArmaPrestada ? (
                                // A. Arma Propia
                                <div className="row g-3 mt-1">
                                    <div className="col-md-12">
                                        <label className="form-label">Arma (Propia del deportista)</label>
                                        <select className="form-select" value={currentArma} onChange={(e) => setCurrentArma(e.target.value)}>
                                            <option value="">Seleccione Arma</option>
                                            {deportistaArmas.length > 0 ? (
                                                deportistaArmas.map(arma => (
                                                    <option key={arma.id} value={arma.id}>{arma.marca} {arma.modelo} ({arma.calibre})</option>
                                                ))
                                            ) : (
                                                <option disabled>Este deportista no tiene armas registradas</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                // B. Arma Prestada
                                <div className="row g-3 mt-1 p-3 border rounded bg-white">
                                    <div className="col-md-6">
                                        <label className="form-label">Prestamista (Deportista del Club)</label>
                                        <select className="form-select" value={selectedLender} onChange={(e) => setSelectedLender(e.target.value)}>
                                            <option value="">Seleccione Prestamista</option>
                                            {deportistas.filter(d => d.id !== parseInt(selectedDeportista)).map(dep => (
                                                <option key={dep.id} value={dep.id}>{dep.first_name} {dep.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Arma (Del Prestamista)</label>
                                        <select className="form-select" value={currentArma} onChange={(e) => setCurrentArma(e.target.value)} disabled={!selectedLender}>
                                            <option value="">Seleccione Arma</option>
                                            {lenderArmas.length > 0 ? (
                                                lenderArmas.map(arma => (
                                                    <option key={arma.id} value={arma.id}>{arma.marca} {arma.modelo} ({arma.calibre})</option>
                                                ))
                                            ) : (
                                                <option disabled>El prestamista no tiene armas</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Lista de participaciones añadidas (sin cambios) */}
                    {participaciones.length > 0 && (
                        <div className="mt-4">
                            <h5>Participaciones a Registrar:</h5>
                            <ul className="list-group">
                                {participaciones.map((p, index) => (
                                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <span className="d-block"><strong>Modalidad:</strong> {p.modalidad_name}</span>
                                            <small className="text-muted"><strong>Arma:</strong> {p.arma_name}</small>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger btn-sm"
                                            onClick={() => setParticipaciones(participaciones.filter((_, i) => i !== index))}
                                        >
                                            Quitar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="col-12 mt-4">
                        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={participaciones.length === 0}>
                            Enviar Inscripción
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default RegisterInscripcion;