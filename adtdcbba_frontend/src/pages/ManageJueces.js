import React, { useState, useEffect } from 'react';
import competenciaService from '../services/competenciaService';
import { FaGavel, FaPlus, FaTrash, FaSave, FaTimes, FaIdCard, FaKey } from 'react-icons/fa';

const ManageJueces = () => {
  const [jueces, setJueces] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newData, setNewData] = useState({ full_name: '', license_number: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await competenciaService.api.get('jueces/');
      setJueces(res.data.results || res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      if(!newData.full_name.trim()) return;
      try {
          await competenciaService.api.post('jueces/', newData);
          setNewData({ full_name: '', license_number: '' });
          setIsCreating(false);
          loadData();
      } catch (err) { alert("Error al registrar juez."); }
  };

  const handleDelete = async (id) => {
      if(window.confirm("¿Eliminar a este juez de la lista?")) {
          try {
              await competenciaService.api.delete(`jueces/${id}/`);
              loadData();
          } catch (err) { alert("Error al eliminar."); }
      }
  };

  // --- ACCIÓN: GENERAR ACCESO ---
  const handleCreateAccess = async (id, nombre) => {
      if(!window.confirm(`¿Generar acceso para ${nombre}?`)) return;
      try {
          const res = await competenciaService.api.post(`jueces/${id}/create_access/`);
          alert(`✅ ACCESO GENERADO:\n\nUsuario: ${res.data.username}\nContraseña: ${res.data.password}\n\n¡Guarda estos datos y entrégalos al Juez!`);
      } catch (err) {
          alert("Error al generar acceso.");
      }
  };

  if (loading) return <div className="text-center p-5">Cargando...</div>;

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Cuerpo de Jueces</h2>
        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setIsCreating(true)}>
            <FaPlus className="me-2"/> Registrar Juez
        </button>
      </div>

      {isCreating && (
          <div className="card-elegant p-4 mb-4 bg-light border-primary border">
              <h5 className="fw-bold text-primary mb-3">Nuevo Oficial</h5>
              <form onSubmit={handleCreate} className="row g-3">
                  <div className="col-md-5">
                      <input 
                        autoFocus type="text" className="form-control rounded-pill" 
                        placeholder="Nombre Completo" 
                        value={newData.full_name} onChange={e => setNewData({...newData, full_name: e.target.value})} required
                      />
                  </div>
                  <div className="col-md-5">
                      <input 
                        type="text" className="form-control rounded-pill" 
                        placeholder="Nro. Licencia / Certificación" 
                        value={newData.license_number} onChange={e => setNewData({...newData, license_number: e.target.value})} required
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
          {jueces.map(juez => (
              <div key={juez.id} className="col-md-6 col-xl-4 mb-4">
                  <div className="card-elegant h-100 p-4 position-relative">
                      <div className="text-center mb-3">
                          <div className="bg-dark text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow-sm" style={{width:'60px', height:'60px'}}>
                              <FaGavel size={24}/>
                          </div>
                          <h5 className="fw-bold text-dark m-0">{juez.full_name}</h5>
                          <span className="badge bg-light text-muted border mt-2">
                              <FaIdCard className="me-1"/> Lic: {juez.license_number}
                          </span>
                      </div>
                      
                      <div className="d-flex justify-content-center gap-2 border-top pt-3">
                          <button 
                            className="btn btn-sm btn-warning rounded-pill px-3 fw-bold text-dark" 
                            onClick={() => handleCreateAccess(juez.id, juez.full_name)}
                            title="Generar Usuario y Contraseña"
                          >
                              <FaKey className="me-1"/> Acceso
                          </button>
                          
                          <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDelete(juez.id)}>
                              <FaTrash/>
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          {jueces.length === 0 && <div className="col-12 text-center p-5 text-muted">No hay jueces registrados.</div>}
      </div>
    </div>
  );
};

export default ManageJueces;