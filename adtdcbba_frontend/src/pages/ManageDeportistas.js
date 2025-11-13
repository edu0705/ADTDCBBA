// src/pages/ManageDeportistas.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import deportistaService from '../services/deportistaService';

const ManageDeportistas = () => {
    const [deportistas, setDeportistas] = useState([]); 
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDeportistas();
    }, []);

    const fetchDeportistas = async () => {
        try {
            const response = await deportistaService.getDeportistas(); 
            // Mostramos TODOS los deportistas, sin filtrar los rechazados
            setDeportistas(response.data);
            setError('');
        } catch (err) {
            console.error("Error fetching deportistas:", err);
            setError("Error al cargar la lista de deportistas.");
        }
    };

    // Llama a la acción 'approve'
    const handleApprove = async (id) => {
        setMessage(''); setError('');
        try {
            const response = await deportistaService.approveDeportista(id);
            alert(
                `¡Deportista Aprobado!\n\n` +
                `Usuario: ${response.data.username}\n` +
                `Contraseña: ${response.data.password}\n\n` +
                `Guarda esta contraseña para dársela al deportista.`
            );
            setMessage(response.data.message);
            fetchDeportistas(); 
        } catch (err) {
            setError("Fallo al aprobar al deportista. ¿Quizás el CI ya está en uso como usuario?");
        }
    };

    // ¡NUEVA FUNCIÓN! Llama a la acción 'suspend'
    const handleSuspend = async (id) => {
        if (!window.confirm("¿Está seguro de suspender a este deportista? Su cuenta será desactivada y no podrá iniciar sesión.")) return;
        
        setMessage(''); setError('');
        try {
            await deportistaService.suspendDeportista(id);
            setMessage(`Deportista ID ${id} marcado como Suspendido.`);
            fetchDeportistas(); 
        } catch (err) {
            setError("Fallo al suspender al deportista.");
        }
    };

    // ¡NUEVA FUNCIÓN! Llama a la acción 'reactivate'
    const handleReactivate = async (id) => {
        setMessage(''); setError('');
        try {
            await deportistaService.reactivateDeportista(id);
            setMessage(`Deportista ID ${id} reactivado.`);
            fetchDeportistas(); 
        } catch (err) {
            setError("Fallo al reactivar al deportista.");
        }
    };

    // Llama a la acción 'update' (PATCH) genérica
    const handleReject = async (id) => {
        const motivo = prompt("Ingrese el motivo detallado del rechazo (obligatorio):");
        if (!motivo) return; 

        setMessage(''); setError('');
        try {
            await deportistaService.updateDeportista(id, { status: 'Rechazado', notas_admin: `Rechazo: ${motivo}` });
            setMessage(`Deportista ID ${id} RECHAZADO con motivo.`);
            fetchDeportistas();
        } catch (err) {
            setError("Fallo al rechazar al deportista.");
        }
    };

    // Función helper para los badges de estado
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Activo': return 'badge bg-success';
            case 'Suspendido': return 'badge bg-secondary';
            case 'Rechazado': return 'badge bg-danger';
            case 'Pendiente de Aprobación': return 'badge bg-warning text-dark';
            default: return 'badge bg-light text-dark';
        }
    };

    return (
        <div className="container-fluid mt-4">
            <h2 className="text-primary mb-4">Gestión de Aprobación de Deportistas</h2>
            
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card shadow-sm">
                <div className="card-body">
                    <h4 className="mb-3 text-secondary">Solicitudes Pendientes y Perfiles Activos</h4>
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>Nombre Completo</th>
                                <th>Club</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deportistas.map(dep => (
                                <tr key={dep.id}>
                                    <td>{dep.first_name} {dep.last_name}</td>
                                    <td><span className="badge bg-primary">{dep.club_info || 'N/A'}</span></td> 
                                    <td><span className={getStatusBadge(dep.status)}>{dep.status}</span></td>
                                    <td>
                                        <Link to={`/admin/deportistas/${dep.id}`} className="btn btn-sm btn-info me-2 text-white">
                                            <i className="bi bi-eye me-1"></i> Revisar
                                        </Link>

                                        {/* --- BOTONES CON LÓGICA CONDICIONAL --- */}

                                        {/* 1. Si está Pendiente */}
                                        {dep.status === 'Pendiente de Aprobación' && (
                                            <>
                                                <button onClick={() => handleApprove(dep.id)} className="btn btn-sm btn-success me-2">
                                                    <i className="bi bi-check-lg me-1"></i> Aprobar
                                                </button>
                                                <button onClick={() => handleReject(dep.id)} className="btn btn-sm btn-danger">
                                                    <i className="bi bi-x-lg me-1"></i> Rechazar
                                                </button>
                                            </>
                                        )}
                                        
                                        {/* 2. Si está Activo */}
                                        {dep.status === 'Activo' && (
                                            <button onClick={() => handleSuspend(dep.id)} className="btn btn-sm btn-outline-danger">
                                                Suspender
                                            </button>
                                        )}

                                        {/* 3. Si está Suspendido o Rechazado */}
                                        {(dep.status === 'Suspendido' || dep.status === 'Rechazado') && (
                                            <button onClick={() => handleReactivate(dep.id)} className="btn btn-sm btn-outline-success">
                                                Reactivar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageDeportistas;