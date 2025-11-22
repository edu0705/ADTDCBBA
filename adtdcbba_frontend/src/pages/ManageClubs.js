import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clubService from '../services/clubService';
import { FaShieldAlt, FaTrash, FaPlus, FaSearch, FaBuilding } from 'react-icons/fa'; // <-- FaEdit ELIMINADO

const ManageClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const res = await clubService.getAllClubs();
      setClubs(res.data.results || res.data);
    } catch (err) {
      console.error("Error cargando clubes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
      if(window.confirm("¿Estás seguro de eliminar este club? Se borrarán sus deportistas asociados.")) {
          try {
              await clubService.api.delete(`clubs/${id}/`);
              loadClubs();
          } catch (err) { alert("Error al eliminar"); }
      }
  };

  const filtered = clubs.filter(c => 
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.presidente_club?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="text-center p-5">Cargando clubes...</div>;

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Clubes Afiliados</h2>
        <Link to="/register-club" className="btn btn-primary rounded-pill px-4 shadow-sm">
            <FaPlus className="me-2"/> Registrar Club
        </Link>
      </div>

      <div className="card-elegant mb-4 p-3">
          <div className="input-group border rounded-pill overflow-hidden bg-light">
              <span className="input-group-text border-0 bg-transparent ps-3"><FaSearch className="text-muted"/></span>
              <input type="text" className="form-control border-0 bg-transparent" placeholder="Buscar club..." value={filter} onChange={e=>setFilter(e.target.value)}/>
          </div>
      </div>

      <div className="row">
          {filtered.map(club => (
              <div key={club.id} className="col-md-6 col-xl-4 mb-4">
                  <div className="card-elegant h-100 p-4 position-relative hover-scale">
                      <div className="d-flex align-items-center gap-3 mb-3">
                          <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                              <FaShieldAlt size={24}/>
                          </div>
                          <div>
                              <h5 className="fw-bold text-dark m-0">{club.name}</h5>
                              <small className="text-muted">ID: {club.id}</small>
                          </div>
                      </div>
                      
                      <div className="text-muted small mb-3">
                          <p className="mb-1"><FaUser className="me-2 opacity-50"/> Pres: {club.presidente_club || 'N/D'}</p>
                          <p className="mb-1"><FaBuilding className="me-2 opacity-50"/> Lic: {club.numero_licencia || 'S/N'}</p>
                      </div>

                      <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top border-light">
                          <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => handleDelete(club.id)}>
                              <FaTrash/> Eliminar
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          {filtered.length === 0 && <div className="col-12 text-center p-5 text-muted">No hay clubes registrados.</div>}
      </div>
    </div>
  );
};

// Icono auxiliar FaUser
const FaUser = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 448 512"><path fill="currentColor" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0S96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.7-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/></svg>;

export default ManageClubs;