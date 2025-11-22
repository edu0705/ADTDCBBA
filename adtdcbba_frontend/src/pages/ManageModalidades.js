import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';
import { FaPlus, FaTrash, FaSave, FaTimes } from 'react-icons/fa'; // <-- FaList ELIMINADO

const ManageModalidades = () => {
  const [modalidades, setModalidades] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await competenciaService.getModalidades();
      setModalidades(res.data.results || res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      if(!newName.trim()) return;
      try {
          await competenciaService.api.post('modalidades/', { name: newName });
          setNewName('');
          setIsCreating(false);
          loadData();
      } catch (err) { alert("Error al crear (¿Quizás ya existe?)"); }
  };

  const handleDelete = async (id) => {
      if(window.confirm("¿Eliminar esta modalidad?")) {
          try {
              await competenciaService.api.delete(`modalidades/${id}/`);
              loadData();
          } catch (err) { alert("No se puede eliminar si ya tiene competencias asociadas."); }
      }
  };

  if (loading) return <div className="text-center p-5">Cargando...</div>;

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Modalidades Deportivas</h2>
        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setIsCreating(true)}>
            <FaPlus className="me-2"/> Nueva Modalidad
        </button>
      </div>

      {/* Formulario de Creación */}
      {isCreating && (
          <div className="card-elegant p-4 mb-4 bg-light border-primary border">
              <h5 className="fw-bold text-primary mb-3">Crear Nueva Modalidad</h5>
              <form onSubmit={handleCreate} className="d-flex gap-3">
                  <input 
                    autoFocus
                    type="text" 
                    className="form-control rounded-pill" 
                    placeholder="Ej: Tiro Práctico - Pistola" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)}
                  />
                  <button type="submit" className="btn btn-success rounded-pill px-4"><FaSave/> Guardar</button>
                  <button type="button" className="btn btn-secondary rounded-pill px-3" onClick={() => setIsCreating(false)}><FaTimes/></button>
              </form>
          </div>
      )}

      <div className="card-elegant p-0 overflow-hidden">
          <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                      <tr>
                          <th className="ps-4 py-3">ID</th>
                          <th>Nombre de la Modalidad</th>
                          <th className="text-end pe-4">Acciones</th>
                      </tr>
                  </thead>
                  <tbody>
                      {modalidades.map(mod => (
                          <tr key={mod.id}>
                              <td className="ps-4 text-muted">#{mod.id}</td>
                              <td className="fw-bold text-dark">{mod.name}</td>
                              <td className="text-end pe-4">
                                  <button className="btn btn-sm btn-light text-danger rounded-circle" onClick={() => handleDelete(mod.id)}>
                                      <FaTrash/>
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {modalidades.length === 0 && <tr><td colSpan="3" className="text-center p-4">No hay modalidades registradas.</td></tr>}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default ManageModalidades;