// src/pages/ManageJueces.js
import React, { useState } from 'react';
import competenciaService from '../services/competenciaService';

// --- ¡NUEVAS IMPORTACIONES! ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ManageJueces = () => {
    // --- ESTADO DEL FORMULARIO (Se mantiene) ---
    const [nombre, setNombre] = useState('');
    const [licencia, setLicencia] = useState('');
    
    // Obtenemos el cliente de query para invalidar la caché
    const queryClient = useQueryClient();

    // --- 1. OBTENER DATOS (con useQuery) ---
    const { 
        data: jueces,     // Renombra 'data' a 'jueces'
        isLoading,      // Estado de carga (true/false)
        isError,        // Estado de error (true/false)
        error           // El objeto de error
    } = useQuery({
        queryKey: ['jueces'], // Esta es la "llave" única para la caché
        queryFn: () => competenciaService.getJueces().then(res => res.data.results || res.data)
    });

    // --- 2. MUTACIÓN PARA CREAR (con useMutation) ---
    const createJuezMutation = useMutation({
        mutationFn: competenciaService.createJuez, // La función que hace el POST
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jueces'] });
            alert('Juez creado con éxito');
            setNombre('');
            setLicencia('');
        },
        onError: (err) => {
            alert(`Error al crear juez: ${err.message}`);
        }
    });

    // --- 3. MUTACIÓN PARA BORRAR (con useMutation) ---
    const deleteJuezMutation = useMutation({
        mutationFn: competenciaService.deleteJuez, // La función que hace el DELETE
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jueces'] });
            alert('Juez eliminado con éxito');
        },
        onError: (err) => {
            alert(`Error al eliminar juez: ${err.message}`);
        }
    });

    // --- 4. MANEJADORES DE EVENTOS (Actualizados) ---
    const handleCreate = (e) => {
        e.preventDefault();
        createJuezMutation.mutate({ nombre, licencia });
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Seguro que quieres eliminar este juez?')) {
            deleteJuezMutation.mutate(id);
        }
    };

    // --- 5. RENDERIZADO (Actualizado) ---
    
    if (isLoading) {
        return <div className="text-center mt-5">Cargando jueces...</div>;
    }

    if (isError) {
        return <div className="alert alert-danger">Error al cargar jueces: {error.message}</div>;
    }

    return (
        <div className="container mt-4">
            <h2>Gestionar Jueces</h2>
            
            <div className="card p-3 mb-4 shadow-sm">
                <form onSubmit={handleCreate}>
                    <div className="row g-2">
                        <div className="col-md">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nombre completo del Juez"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nro. de Licencia (Opcional)"
                                value={licencia}
                                onChange={(e) => setLicencia(e.target.value)}
                            />
                        </div>
                        <div className="col-md-auto">
                            <button 
                                type="submit" 
                                className="btn btn-primary w-100"
                                disabled={createJuezMutation.isPending}
                            >
                                {createJuezMutation.isPending ? 'Creando...' : 'Crear Juez'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            
            <h3>Jueces Existentes</h3>
            <table className="table table-striped table-hover">
                <thead className="table-dark">
                    <tr>
                        <th>Nombre</th>
                        <th>Licencia</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {jueces && jueces.map(juez => ( // <-- La variable es 'juez'
                        <tr key={juez.id}>
                            {/* --- ¡CORRECCIÓN AQUÍ! --- */}
                            <td>{juez.nombre}</td> 
                            <td>{juez.licencia || 'N/A'}</td>
                            {/* --- Fin de la corrección --- */}
                            <td>
                                <button 
                                    onClick={() => handleDelete(juez.id)}
                                    className="btn btn-danger btn-sm"
                                    disabled={deleteJuezMutation.isPending}
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {jueces && jueces.length === 0 && (
                        <tr>
                            <td colSpan="3" className="text-center text-muted">No hay jueces registrados.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ManageJueces;