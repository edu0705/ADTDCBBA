// src/pages/RegisterDeportista.js
import React from 'react';
import deportistaService from '../services/deportistaService';

// --- ¡NUEVA IMPORTACIÓN! ---
import { useForm } from 'react-hook-form';

const RegisterDeportista = () => {
    
    // --- 1. REEMPLAZAR TODOS LOS useState del formulario ---
    const { 
        register,     // Función para "registrar" un input
        handleSubmit, // Wrapper para tu función de submit
        formState: { errors, isSubmitting }, // Objeto con errores y estado de carga
        reset // Función para limpiar el formulario
    } = useForm();
    
    // --- 2. NUEVA FUNCIÓN DE SUBMIT ---
    // 'handleSubmit' (de useForm) llama a esta función
    // y le pasa 'data' si y solo si la validación pasó.
    const onSubmit = async (data) => {
        // 'data' es un objeto con todos los valores del formulario
        // ej: { first_name: "Juan", apellido_paterno: "Perez", ... }
        
        const formData = new FormData();
        
        // Mapea los datos del formulario al FormData
        // (Asegúrate que los nombres coincidan con el 'register' y tu API)
        formData.append('first_name', data.first_name);
        formData.append('apellido_paterno', data.apellido_paterno);
        formData.append('apellido_materno', data.apellido_materno);
        formData.append('ci', data.ci);
        formData.append('fecha_nacimiento', data.fecha_nacimiento);
        formData.append('nacionalidad', data.nacionalidad || 'Boliviana');
        formData.append('telefono', data.telefono);
        formData.append('email', data.email);
        
        // Manejo de archivos (vienen como un FileList)
        // 'react-hook-form' maneja los archivos nativamente
        if (data.foto_perfil && data.foto_perfil.length > 0) {
            formData.append('foto_perfil', data.foto_perfil[0]);
        }
        if (data.doc_ci_anverso && data.doc_ci_anverso.length > 0) {
            formData.append('doc_ci_anverso', data.doc_ci_anverso[0]);
        }
        if (data.doc_ci_reverso && data.doc_ci_reverso.length > 0) {
            formData.append('doc_ci_reverso', data.doc_ci_reverso[0]);
        }
        if (data.doc_matricula_arma && data.doc_matricula_arma.length > 0) {
            formData.append('doc_matricula_arma', data.doc_matricula_arma[0]);
        }
        if (data.doc_antecedentes && data.doc_antecedentes.length > 0) {
            formData.append('doc_antecedentes', data.doc_antecedentes[0]);
        }

        try {
            await deportistaService.createDeportista(formData);
            alert('Deportista registrado con éxito. Pendiente de aprobación por un administrador.');
            reset(); // Limpia el formulario después del éxito
        } catch (err) {
            console.error(err);
            // Mejora: Lee el error específico de la API si existe
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Revisa los campos e inténtalo de nuevo.';
            alert(`Error al registrar deportista: ${errorMsg}`);
        }
    };

    // --- 3. JSX ACTUALIZADO ---
    
    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <h2>Registro de Nuevo Deportista</h2>
                    <p className="text-muted">El deportista será registrado como 'Pendiente' y debe ser aprobado por un administrador.</p>
                    
                    {/* 1. Usa 'handleSubmit' para envolver tu 'onSubmit' */}
                    <form onSubmit={handleSubmit(onSubmit)} className="card p-4 shadow-sm">
                        
                        <h5 className="mt-2">Información Personal</h5>
                        <hr />
                        
                        <div className="row">
                            {/* --- CAMPO DE TEXTO (Ejemplo: Nombre) --- */}
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Nombre(s)</label>
                                <input
                                    type="text"
                                    // 2. Aplica clase de error si 'errors.first_name' existe
                                    className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                                    // 3. "Registra" el input. No más 'value' ni 'onChange'
                                    {...register('first_name', { required: 'El nombre es obligatorio' })}
                                />
                                {/* 4. Muestra el error de validación */}
                                {errors.first_name && <div className="invalid-feedback">{errors.first_name.message}</div>}
                            </div>
                            
                            {/* --- CAMPO DE TEXTO (Ejemplo: Apellido Paterno) --- */}
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Apellido Paterno</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.apellido_paterno ? 'is-invalid' : ''}`}
                                    {...register('apellido_paterno', { required: 'El apellido paterno es obligatorio' })}
                                />
                                {errors.apellido_paterno && <div className="invalid-feedback">{errors.apellido_paterno.message}</div>}
                            </div>
                            
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Apellido Materno</label>
                                <input
                                    type="text"
                                    className="form-control" // Opcional, no requerido
                                    {...register('apellido_materno')}
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label className="form-label">Cédula de Identidad (CI)</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.ci ? 'is-invalid' : ''}`}
                                    {...register('ci', { required: 'El CI es obligatorio' })}
                                />
                                {errors.ci && <div className="invalid-feedback">{errors.ci.message}</div>}
                            </div>

                            <div className="col-md-4 mb-3">
                                <label className="form-label">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    className={`form-control ${errors.fecha_nacimiento ? 'is-invalid' : ''}`}
                                    {...register('fecha_nacimiento', { required: 'La fecha de nacimiento es obligatoria' })}
                                />
                                {errors.fecha_nacimiento && <div className="invalid-feedback">{errors.fecha_nacimiento.message}</div>}
                            </div>

                            <div className="col-md-4 mb-3">
                                <label className="form-label">Nacionalidad</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    defaultValue="Boliviana"
                                    {...register('nacionalidad')}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Teléfono/Celular</label>
                                <input
                                    type="tel"
                                    className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                                    {...register('telefono', { required: 'El teléfono es obligatorio' })}
                                />
                                {errors.telefono && <div className="invalid-feedback">{errors.telefono.message}</div>}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    {...register('email', { 
                                        required: 'El email es obligatorio',
                                        pattern: { // Validación de email simple
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Formato de email inválido"
                                        }
                                    })}
                                />
                                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                            </div>
                        </div>

                        <h5 className="mt-4">Documentos y Archivos</h5>
                        <hr />

                        <div className="row">
                            {/* --- CAMPO DE ARCHIVO (Ejemplo: Foto Perfil) --- */}
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Foto de Perfil (tipo carnet)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className={`form-control ${errors.foto_perfil ? 'is-invalid' : ''}`}
                                    {...register('foto_perfil', { required: 'La foto de perfil es obligatoria' })}
                                />
                                {errors.foto_perfil && <div className="invalid-feedback">{errors.foto_perfil.message}</div>}
                            </div>
                            
                            {/* ... aplica el mismo patrón para los otros 4 campos de archivo ... */}

                            <div className="col-md-6 mb-3">
                                <label className="form-label">CI Anverso (Escaneado)</label>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className={`form-control ${errors.doc_ci_anverso ? 'is-invalid' : ''}`}
                                    {...register('doc_ci_anverso', { required: 'El anverso del CI es obligatorio' })}
                                />
                                {errors.doc_ci_anverso && <div className="invalid-feedback">{errors.doc_ci_anverso.message}</div>}
                            </div>
                            
                            <div className="col-md-6 mb-3">
                                <label className="form-label">CI Reverso (Escaneado)</label>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className={`form-control ${errors.doc_ci_reverso ? 'is-invalid' : ''}`}
                                    {...register('doc_ci_reverso', { required: 'El reverso del CI es obligatorio' })}
                                />
                                {errors.doc_ci_reverso && <div className="invalid-feedback">{errors.doc_ci_reverso.message}</div>}
                            </div>
                            
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Matrícula de Arma (Opcional)</label>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="form-control"
                                    {...register('doc_matricula_arma')}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Antecedentes (FELCC, Opcional)</label>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="form-control"
                                    {...register('doc_antecedentes')}
                                />
                            </div>
                        </div>

                        <hr className="mt-4" />
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-lg w-100"
                            // 5. Usa 'isSubmitting' para deshabilitar el botón
                            disabled={isSubmitting} 
                        >
                            {isSubmitting ? 'Registrando Deportista...' : 'Registrar Deportista'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterDeportista;