// src/pages/RegisterDeportista.js
import React, { useState } from 'react';
import deportistaService from '../services/deportistaService';

const departamentosBolivia = [
    'Beni', 'Chuquisaca', 'Cochabamba', 'La Paz', 
    'Oruro', 'Pando', 'Potosí', 'Santa Cruz', 'Tarija'
];

// ESLint dice que 'tiposArma' no se usa...
const tiposArma = [
    'Carabina de aire comprimido', 'Carabina .22', 'Fusil de grueso calibre', 
    'Pistola de aire comprimido', 'Pistola de fuego anular', 'Pistola de velocidad olímpica', 
    'Pistola libre', 'Escopeta', 'Pistola semiautomática', 'Revólveres', 
    'Carabinas y rifles', 'Escopetas'
];

// ... y que 'tiposCalibre' no se usa.
const tiposCalibre = [
    '.177 / 4.5 mm', '.22 Long Rifle', '7.62 mm', '9 mm', '.40 S&W', '.45 ACP', 'Calibre 12'
];

const RegisterDeportista = () => {
    const [deportistaData, setDeportistaData] = useState({ 
        first_name: '', 
        apellido_paterno: '', 
        apellido_materno: '', 
        ci: '', 
        birth_date: '',
        departamento: '', 
        genero: '', 
        telefono: '', 
        foto_path: null
    });
    
    const [documentos, setDocumentos] = useState([]);
    const [armas, setArmas] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setDeportistaData({ ...deportistaData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setDeportistaData({ ...deportistaData, [e.target.name]: e.target.files[0] });
    };

    // ESLint dice que 'handleDocChange' no se usa...
    const handleDocChange = (index, e) => {
        const newDocs = [...documentos];
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            newDocs[index][name] = files[0];
        } else {
            if (name === 'document_type' && value !== 'Licencia B') {
                newDocs[index].expiration_date = ''; 
            }
            newDocs[index][name] = value;
        }
        setDocumentos(newDocs);
    };

    // ... y que 'handleArmaChange' no se usa.
    const handleArmaChange = (index, e) => {
        const newArmas = [...armas];
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            newArmas[index][name] = files[0];
        } else {
            newArmas[index][name] = value;
        }
        setArmas(newArmas);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');

        const formData = new FormData();
        
        for (const key in deportistaData) {
            if (deportistaData[key]) {
                formData.append(key, deportistaData[key]);
            }
        }
        if (deportistaData.foto_path) {
            formData.append('foto_path', deportistaData.foto_path, deportistaData.foto_path.name);
        }

        // ESLint dice que 'docsData' tiene un error de map...
        const docsData = documentos.map(doc => {
            const data = {
                document_type: doc.document_type,
            };
            if (doc.document_type === 'Licencia B' && doc.expiration_date) {
                data.expiration_date = doc.expiration_date;
            }
            return data; // <-- ¡El return SÍ está aquí!
        });
        
        const armasData = armas.map(arma => ({
            tipo: arma.tipo, calibre: arma.calibre, marca: arma.marca, 
            modelo: arma.modelo, numero_matricula: arma.numero_matricula,
            fecha_inspeccion: arma.fecha_inspeccion 
        }));

        formData.append('documentos', JSON.stringify(docsData));
        formData.append('armas', JSON.stringify(armasData));

        documentos.forEach((doc, index) => {
            if (doc.file_path) {
                formData.append(`documentos_file[${index}]`, doc.file_path, doc.file_path.name);
            }
        });
        armas.forEach((arma, index) => {
            if (arma.file_path) {
                formData.append(`armas_file[${index}]`, arma.file_path, arma.file_path.name);
            }
        });

      try {
        await deportistaService.createDeportista(formData); 
        setMessage('Deportista registrado con éxito. Pendiente de aprobación.');
        
        setDeportistaData({ 
            first_name: '', apellido_paterno: '', apellido_materno: '', ci: '', 
            birth_date: '', departamento: '', genero: '', telefono: '', foto_path: null 
        });
        setDocumentos([]);
        setArmas([]);

    } catch (err) {
        console.error("Error detallado:", err.response ? err.response.data : err.message);
        if (err.response && err.response.data) {
            const errorData = err.response.data;
            let specificError = "";
            if (errorData.ci) {
                specificError = `CI: ${errorData.ci[0]}`;
            } else if (errorData.detail) {
                specificError = errorData.detail;
            } else {
                const firstKey = Object.keys(errorData)[0];
                specificError = `${firstKey}: ${errorData[firstKey][0]}`;
            }
            setError(specificError);
        } else {
            setError('Error al conectar con el servidor. Intente de nuevo.');
        }
    }
};

    const addDocumento = () => setDocumentos([...documentos, { document_type: 'Licencia B', file_path: null, expiration_date: '' }]);
    const addArma = () => setArmas([...armas, { tipo: '', calibre: '', marca: '', modelo: '', numero_matricula: '', fecha_inspeccion: '', file_path: null }]);

    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-primary">Registro de Nuevo Deportista</h2>
            
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card shadow-lg p-4">
                <form onSubmit={handleSubmit} className="row g-4"> 
                    
                    <h4 className="border-bottom pb-2 text-secondary">Datos Personales</h4>
                    <div className="col-md-4">
                        <input type="text" className="form-control" name="first_name" placeholder="Nombres" value={deportistaData.first_name} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                        <input type="text" className="form-control" name="apellido_paterno" placeholder="Apellido Paterno" value={deportistaData.apellido_paterno} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                        <input type="text" className="form-control" name="apellido_materno" placeholder="Apellido Materno (Opcional)" value={deportistaData.apellido_materno} onChange={handleChange} />
                    </div>
                    
                    <div className="col-md-4">
                        <input type="text" className="form-control" name="ci" placeholder="CI" value={deportistaData.ci} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Fecha de Nacimiento</label>
                        <input type="date" className="form-control" name="birth_date" value={deportistaData.birth_date} onChange={handleChange} required />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Departamento</label>
                        <select className="form-select" name="departamento" value={deportistaData.departamento} onChange={handleChange} required>
                            <option value="">Seleccione Depto.</option>
                            {departamentosBolivia.map(depto => (<option key={depto} value={depto}>{depto}</option>))}
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Género</label>
                        <select className="form-select" name="genero" value={deportistaData.genero} onChange={handleChange} required>
                            <option value="">Seleccione Género</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Teléfono</label>
                        <input type="text" className="form-control" name="telefono" placeholder="Teléfono" value={deportistaData.telefono} onChange={handleChange} />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Foto de Perfil</label>
                        <input type="file" className="form-control" name="foto_path" onChange={handleFileChange} />
                    </div>
                    
                    {/* SECCIÓN 2: Documentos */}
                    <h4 className="mt-5 border-bottom pb-2 text-secondary">Documentos (Licencia B, Carnet)</h4>
                    {documentos.map((doc, index) => (
                        <div key={index} className="border p-3 rounded mb-3 col-12">
                            <h6 className="text-muted">Documento #{index + 1}</h6>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">Tipo de Documento</label>
                                    <select className="form-select" name="document_type" value={doc.document_type} onChange={(e) => handleDocChange(index, e)} required>
                                        <option value="Licencia B">Licencia B (PDF)</option>
                                        <option value="Carnet de Identidad">Carnet de Identidad (PDF)</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Fecha de Vencimiento</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        name="expiration_date" 
                                        value={doc.expiration_date}
                                        /* ... pero SÍ se usa aquí */
                                        onChange={(e) => handleDocChange(index, e)} 
                                        disabled={doc.document_type === 'Carnet de Identidad'}
                                        required={doc.document_type === 'Licencia B'}
                                    />
                                    {doc.document_type === 'Carnet de Identidad' && <div className="form-text">No aplica vencimiento para CI.</div>}
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Archivo (PDF)</label>
                                    <input type="file" className="form-control" name="file_path" onChange={(e) => handleDocChange(index, e)} required />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="col-12"><button type="button" onClick={addDocumento} className="btn btn-outline-secondary btn-sm"><i className="bi bi-file-earmark-plus"></i> Añadir Documento</button></div>

                    {/* SECCIÓN 3: Armas */}
                    <h4 className="mt-5 border-bottom pb-2 text-secondary">Armas Registradas</h4>
                    {armas.map((arma, index) => (
                        <div key={index} className="border p-3 rounded mb-3 col-12">
                            <h6 className="text-muted">Arma #{index + 1}</h6>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">Tipo de Arma</label>
                                    <select className="form-select" name="tipo" value={arma.tipo} onChange={(e) => handleArmaChange(index, e)} required>
                                        <option value="">Seleccione Tipo</option>
                                        {/* ... pero SÍ se usa aquí */
                                        tiposArma.map(tipo => (<option key={tipo} value={tipo}>{tipo}</option>))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Calibre</label>
                                    <select className="form-select" name="calibre" value={arma.calibre} onChange={(e) => handleArmaChange(index, e)} required>
                                        <option value="">Seleccione Calibre</option>
                                        {/* ... pero SÍ se usa aquí */
                                        tiposCalibre.map(calibre => (<option key={calibre} value={calibre}>{calibre}</option>))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Fecha de Inspección</label>
                                    <input type="date" className="form-control" name="fecha_inspeccion" value={arma.fecha_inspeccion} onChange={(e) => handleArmaChange(index, e)} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Marca</label>
                                    <input type="text" className="form-control" name="marca" placeholder="Marca" value={arma.marca} onChange={(e) => handleArmaChange(index, e)} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Modelo</label>
                                    <input type="text" className="form-control" name="modelo" placeholder="Modelo" value={arma.modelo} onChange={(e) => handleArmaChange(index, e)} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">N° de Matrícula</label>
                                    <input type="text" className="form-control" name="numero_matricula" placeholder="N° Matrícula" value={arma.numero_matricula} onChange={(e) => handleArmaChange(index, e)} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Matrícula (PDF)</label>
                                    <input type="file" className="form-control" name="file_path" onChange={(e) => handleArmaChange(index, e)} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="col-12"><button type="button" onClick={addArma} className="btn btn-outline-secondary btn-sm"><i className="bi bi-gun"></i> Añadir Arma</button></div>
                    
                    {/* Botón Final */}
                    <div className="col-12 mt-5">
                        <button type="submit" className="btn btn-primary w-100 btn-lg">
                            <i className="bi bi-person-plus me-2"></i> Registrar Deportista
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterDeportista;