// src/pages/MiPerfil.js
import React, { useState, useEffect } from 'react';
import deportistaService from '../services/deportistaService'; 

// ¡VARIABLE 'BACKEND_URL' ELIMINADA! Ya no es necesaria.

const MiPerfil = () => {
    const [deportista, setDeportista] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchMiPerfil = async () => {
            try {
                const response = await deportistaService.getMiPerfil();
                setDeportista(response.data); 
            } catch (err) {
                console.error("Error al cargar el perfil:", err.response || err);
                setError("No se pudo cargar tu perfil. Asegúrate de estar logueado como deportista.");
            } finally {
                setLoading(false);
            }
        };

        fetchMiPerfil();
    }, []); 

    const val = (value) => value || 'N/A';
    
    if (loading) return <div className="container mt-5">Cargando perfil...</div>;
    if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;
    if (!deportista) {
        return (
            <div className="container mt-5">
                <h2 className="text-primary mb-4">Mi Perfil de Deportista</h2>
                <div className="alert alert-warning">
                    No se encontró un perfil de deportista.
                </div>
            </div>
        );
    }
    
    return (
        <div className="container-fluid mt-4">
            <h2 className="text-primary mb-4">Mi Perfil: {val(deportista.first_name)} {val(deportista.last_name)}</h2>
            
            {/* Tarjeta de Información General */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-info text-white">
                    Información Básica
                </div>
                <div className="card-body row">
                    <div className="col-md-4"><strong>Club:</strong> <span className="badge bg-primary">{val(deportista.club_info)}</span></div>
                    <div className="col-md-4"><strong>Estado Actual:</strong> <span className="badge bg-success">{val(deportista.status)}</span></div>
                    <div className="col-md-4"><strong>Email:</strong> {val(deportista.email)}</div>
                    <hr className="my-2" />
                    <div className="col-md-4"><strong>CI:</strong> {val(deportista.ci)}</div>
                    <div className="col-md-4"><strong>Fecha Nacimiento:</strong> {val(deportista.birth_date)}</div>
                    <div className="col-md-4"><strong>Teléfono:</strong> {val(deportista.telefono)}</div>
                </div>
            </div>

            {/* Documentos */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-secondary text-white">Mi Documentación</div>
                <ul className="list-group list-group-flush">
                    {deportista.documentos && deportista.documentos.length > 0 ? (
                        deportista.documentos.map((doc, index) => (
                            <li key={doc.id || index} className="list-group-item d-flex justify-content-between align-items-center">
                                <strong>{val(doc.document_type)}</strong>
                                {doc.file_path ? (
                                    /* Usamos doc.file_path directamente, ya que es la URL completa */
                                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                        Ver Archivo
                                    </a>
                                ) : <span className="text-muted small">Sin archivo</span>}
                            </li>
                        ))
                    ) : (<li className="list-group-item text-muted">No has subido documentos.</li>)}
                </ul>
            </div>

            {/* Armas */}
            <div className="card shadow-sm mb-4">
                 <div className="card-header bg-secondary text-white">Mis Armas</div>
                 <ul className="list-group list-group-flush">
                     {deportista.armas && deportista.armas.length > 0 ? (
                        deportista.armas.map((arma, index) => (
                            <li key={arma.id || index} className="list-group-item">
                                <strong>{val(arma.marca)} {val(arma.modelo)}</strong> ({val(arma.calibre)})
                                {arma.file_path ? (
                                    /* Usamos arma.file_path directamente */
                                    <a href={arma.file_path} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary ms-3">
                                        Ver Matrícula
                                    </a>
                                ) : <span className="text-muted small ms-3">Sin Matrícula</span>}
                            </li>
                        ))
                    ) : (<li className="list-group-item text-muted">No has registrado armas.</li>)}
                </ul>
            </div>
        </div>
    );
};

export default MiPerfil;