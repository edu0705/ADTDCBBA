import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import deportistaService from '../services/deportistaService';
import clubService from '../services/clubService';
import { useAuth } from '../context/AuthContext';
import { FaUserPlus, FaSave, FaHistory } from 'react-icons/fa';

const RegisterDeportista = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    first_name: '',
    apellido_paterno: '',
    apellido_materno: '',
    ci: '',
    birth_date: '',
    departamento: 'Cochabamba',
    genero: 'M',
    telefono: '',
    club: '',
    es_historico: false // NUEVO CAMPO
  });

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Si es Admin, cargar lista de clubes
    if (hasRole('Presidente')) {
      const fetchClubs = async () => {
        try {
            const res = await clubService.getAllClubs();
            setClubs(res.data.results || res.data);
        } catch (err) { console.error(err); }
      };
      fetchClubs();
    } else if (user.club_id) {
        // Si es Club, asignar su propio ID automáticamente
        setFormData(prev => ({ ...prev, club: user.club_id }));
    }
  }, [hasRole, user]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparamos los datos
      const dataToSend = { ...formData };
      
      // Si es histórico, forzamos el estado visual
      if (formData.es_historico) {
          dataToSend.status = 'Pendiente de Documentación';
      }

      await deportistaService.createDeportista(dataToSend);
      setSuccess('Deportista registrado correctamente. Puede completar los documentos luego.');
      
      // Limpiar formulario o redirigir
      setTimeout(() => navigate('/admin/deportistas'), 2000);

    } catch (err) {
      console.error(err);
      if (err.response?.data?.ci) setError("Ya existe un deportista con este CI.");
      else setError("Error al registrar. Verifique los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in py-4">
      <div className="card-elegant mx-auto" style={{ maxWidth: '800px' }}>
        <div className="card-header-elegant bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="m-0"><FaUserPlus className="me-2"/> Registrar Deportista</h4>
        </div>
        
        <div className="card-body p-4">
          {error && <div className="alert alert-danger rounded-pill px-4">{error}</div>}
          {success && <div className="alert alert-success rounded-pill px-4">{success}</div>}

          <form onSubmit={handleSubmit}>
            
            {/* SECCIÓN: TIPO DE REGISTRO */}
            <div className="mb-4 p-3 bg-light rounded-3 border border-warning">
                <div className="form-check form-switch">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="historicoCheck"
                        name="es_historico"
                        checked={formData.es_historico}
                        onChange={handleChange}
                    />
                    <label className="form-check-label fw-bold text-dark" htmlFor="historicoCheck">
                        <FaHistory className="text-warning me-2"/>
                        Registro Histórico / Incompleto
                    </label>
                </div>
                <small className="text-muted d-block mt-1 ms-4">
                    Marque esta opción para registrar datos de gestiones pasadas (2024-2025) sin exigir documentos inmediatos. 
                    El estado será <span className="text-danger fw-bold">"Pendiente de Documentación"</span>.
                </small>
            </div>

            <div className="row g-3">
                {/* Datos Personales */}
                <div className="col-md-6">
                    <label className="form-label small text-muted">Nombres</label>
                    <input type="text" className="form-control" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                    <label className="form-label small text-muted">Apellido Paterno</label>
                    <input type="text" className="form-control" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                    <label className="form-label small text-muted">Apellido Materno</label>
                    <input type="text" className="form-control" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} />
                </div>
                
                <div className="col-md-6">
                    <label className="form-label small text-muted">CI / DNI</label>
                    <input type="text" className="form-control" name="ci" value={formData.ci} onChange={handleChange} required />
                </div>

                <div className="col-md-6">
                    <label className="form-label small text-muted">Fecha Nacimiento</label>
                    <input type="date" className="form-control" name="birth_date" value={formData.birth_date} onChange={handleChange} required />
                </div>

                <div className="col-md-6">
                    <label className="form-label small text-muted">Género</label>
                    <select className="form-select" name="genero" value={formData.genero} onChange={handleChange}>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>

                {/* Selección de Club (Solo para Admin) */}
                {hasRole('Presidente') && (
                    <div className="col-12">
                        <label className="form-label small text-muted">Club Pertenencia</label>
                        <select className="form-select" name="club" value={formData.club} onChange={handleChange} required>
                            <option value="">-- Seleccione Club --</option>
                            {clubs.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="mt-5 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => navigate(-1)}>Cancelar</button>
                <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm" disabled={loading}>
                    {loading ? 'Guardando...' : <><FaSave className="me-2"/> Registrar</>}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterDeportista;
