import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';
import { FaMapMarkerAlt, FaPlus, FaTrash, FaSave, FaTimes, FaBullseye } from 'react-icons/fa';

const ManagePoligonos = () => {
  const [poligonos, setPoligonos] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newData, setNewData] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Usamos la instancia 'api' directamente para flexibilidad
      const res = await competenciaService.api.get('poligonos/');
      setPoligonos(res.data.results || res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      if(!newData.name.trim()) return;
      try {
          await competenciaService.api.post('poligonos/', newData);
          setNewData({ name: '', address: '' });
          setIsCreating(false);
          loadData();
      } catch (err) { alert("Error al crear el polígono."); }
  };

  const handleDelete = async (id) => {
      if(window.confirm("¿Eliminar este polígono?")) {
          try {
              await competenciaService.api.delete(`poligonos/${id}/`);
              loadData();
          } catch (err) { alert("Error al eliminar."); }
      }
  };

  if (loading) return <div className="text-center p-5">Cargando...</div>;

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Polígonos de Tiro</h2>
        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setIsCreating(true)}>
            <FaPlus className="me-2"/> Nuevo Polígono
        </button>
      </div>

      {/* Formulario de Creación */}
      {isCreating && (
          <div className="card-elegant p-4 mb-4 bg-light border-primary border">
              <h5 className="fw-bold text-primary mb-3">Registrar Nueva Sede</h5>
              <form onSubmit={handleCreate} className="row g-3">
                  <div className="col-md-5">
                      <input 
                        autoFocus type="text" className="form-control rounded-pill" 
                        placeholder="Nombre del Polígono (Ej: Club Tunari)" 
                        value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} required
                      />
                  </div>
                  <div className="col-md-5">
                      <input 
                        type="text" className="form-control rounded-pill" 
                        placeholder="Dirección / Ubicación" 
                        value={newData.address} onChange={e => setNewData({...newData, address: e.target.value})} required
                      />
                  </div>
                  <div className="col-md-2 d-flex gap-2">
                      <button type="submit" className="btn btn-success rounded-pill w-100"><FaSave/></button>
                      <button type="button" className="btn btn-secondary rounded-pill w-100" onClick={() => setIsCreating(false)}><FaTimes/></button>
                  </div>
              </form>
          </div>
      )}

      <div className="row">
          {poligonos.map(pol => (
              <div key={pol.id} className="col-md-6 mb-3">
                  <div className="card-elegant p-3 d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-3">
                          <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle">
                              <FaBullseye size={20}/>
                          </div>
                          <div>
                              <h5 className="fw-bold text-dark m-0">{pol.name}</h5>
                              <small className="text-muted"><FaMapMarkerAlt className="me-1"/> {pol.address}</small>
                          </div>
                      </div>
                      <button className="btn btn-sm btn-outline-danger border-0 rounded-circle" onClick={() => handleDelete(pol.id)}>
                          <FaTrash/>
                      </button>
                  </div>
              </div>
          ))}
          {poligonos.length === 0 && <div className="col-12 text-center p-5 text-muted">No hay polígonos registrados.</div>}
      </div>
    </div>
  );
};

export default ManagePoligonos;