import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import deportistaService from '../services/deportistaService';
import { FaUserPlus, FaSearch, FaEdit, FaExclamationTriangle, FaCheckCircle, FaIdCard } from 'react-icons/fa';

const ManageDeportistas = () => {
  const [deportistas, setDeportistas] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeportistas();
  }, []);

  const fetchDeportistas = async () => {
    try {
      const res = await deportistaService.getAllDeportistas();
      setDeportistas(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = deportistas.filter(d => 
    d.first_name.toLowerCase().includes(filter.toLowerCase()) ||
    d.apellido_paterno.toLowerCase().includes(filter.toLowerCase()) ||
    d.ci.includes(filter)
  );

  const getStatusBadge = (status) => {
    switch (status) {
        case 'Activo': return <span className="badge bg-success rounded-pill px-3 py-2 d-flex align-items-center gap-2 w-auto"><FaCheckCircle/> Habilitado</span>;
        case 'Pendiente de Documentación': return <span className="badge bg-danger text-white rounded-pill px-3 py-2 d-flex align-items-center gap-2 w-auto"><FaExclamationTriangle/> Falta Docs</span>;
        case 'Pendiente de Aprobación': return <span className="badge bg-warning text-dark rounded-pill px-3 py-2">Por Aprobar</span>;
        default: return <span className="badge bg-secondary rounded-pill px-3 py-2">{status}</span>;
    }
  };

  if (loading) return <div className="text-center p-5">Cargando directorio...</div>;

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Directorio de Deportistas</h2>
        <Link to="/register-deportista" className="btn btn-primary rounded-pill px-4 shadow-sm">
            <FaUserPlus className="me-2"/> Registrar Nuevo
        </Link>
      </div>

      <div className="card-elegant mb-4 p-3">
        <div className="input-group border-0 bg-light rounded-pill overflow-hidden">
            <span className="input-group-text border-0 bg-transparent ps-3"><FaSearch className="text-muted"/></span>
            <input type="text" className="form-control border-0 bg-transparent" placeholder="Buscar por nombre, apellido o CI..." value={filter} onChange={(e) => setFilter(e.target.value)}/>
        </div>
      </div>

      <div className="card-elegant p-0 overflow-hidden">
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
                <thead className="bg-light text-uppercase small text-muted">
                    <tr>
                        <th className="ps-4 py-3">Deportista</th>
                        <th>CI</th>
                        <th>Club</th>
                        <th>Estado</th>
                        <th className="text-end pe-4">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map(dep => (
                        <tr key={dep.id}>
                            <td className="ps-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width:'40px', height:'40px'}}>
                                        {dep.first_name.charAt(0)}{dep.apellido_paterno.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark">{dep.first_name} {dep.apellido_paterno}</div>
                                        <small className="text-muted">{dep.departamento}</small>
                                    </div>
                                </div>
                            </td>
                            <td className="text-muted font-monospace">{dep.ci}</td>
                            <td className="text-primary fw-bold small">{dep.club_nombre || 'Sin Club'}</td>
                            <td>{getStatusBadge(dep.status)}</td>
                            <td className="text-end pe-4">
                                <div className="d-flex justify-content-end gap-2">
                                    {/* Botón Carnet */}
                                    <button 
                                        className="btn btn-sm btn-outline-dark rounded-circle" 
                                        title="Imprimir Carnet"
                                        onClick={() => deportistaService.downloadCarnet(dep.id, dep.first_name)}
                                    >
                                        <FaIdCard />
                                    </button>

                                    <Link to={`/admin/deportistas/${dep.id}`} className="btn btn-sm btn-outline-primary rounded-pill px-4 fw-bold">
                                        <FaEdit className="me-1"/> Gestionar
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredData.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">No se encontraron deportistas.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ManageDeportistas;