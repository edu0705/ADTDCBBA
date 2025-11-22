import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { FaShieldAlt, FaUser, FaLock, FaSave } from 'react-icons/fa'; // <-- FaBuilding ELIMINADO

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '', // Nombre del Club
    presidente_club: '',
    numero_licencia: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.registerClub(formData);
      alert("Club registrado exitosamente.");
      navigate('/admin/clubs');
    } catch (err) {
      alert("Error al registrar. Verifique si el usuario o club ya existe.");
    }
  };

  return (
    <div className="container fade-in py-5">
      <div className="card-elegant mx-auto" style={{ maxWidth: '600px' }}>
        <div className="card-header-elegant bg-primary text-white text-center py-4">
            <FaShieldAlt size={40} className="mb-2"/>
            <h3 className="m-0 fw-bold">Registrar Nuevo Club</h3>
            <p className="opacity-75 m-0">Creación de cuenta institucional</p>
        </div>
        
        <div className="card-body p-5">
            <form onSubmit={handleSubmit}>
                <h6 className="text-primary border-bottom pb-2 mb-3 text-uppercase small fw-bold">Datos de Acceso</h6>
                <div className="row g-3 mb-4">
                    <div className="col-12">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0"><FaUser className="text-muted"/></span>
                            <input type="text" className="form-control border-start-0" name="username" placeholder="Usuario (Ej: clubtunari)" onChange={handleChange} required/>
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0"><FaLock className="text-muted"/></span>
                            <input type="password" className="form-control border-start-0" name="password" placeholder="Contraseña" onChange={handleChange} required/>
                        </div>
                    </div>
                </div>

                <h6 className="text-primary border-bottom pb-2 mb-3 text-uppercase small fw-bold">Información del Club</h6>
                <div className="row g-3 mb-4">
                    <div className="col-12">
                        <label className="form-label small fw-bold">Nombre del Club</label>
                        <input type="text" className="form-control" name="name" onChange={handleChange} required/>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">Presidente</label>
                        <input type="text" className="form-control" name="presidente_club" onChange={handleChange} required/>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">Nro. Licencia (Personería)</label>
                        <input type="text" className="form-control" name="numero_licencia" onChange={handleChange}/>
                    </div>
                </div>

                <div className="d-grid">
                    <button type="submit" className="btn btn-success rounded-pill py-2 fw-bold shadow-sm hover-scale">
                        <FaSave className="me-2"/> Registrar Club
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Register;