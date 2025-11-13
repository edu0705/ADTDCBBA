// src/pages/Register.js
import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    club_name: '',
    presidente_club: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await authService.registerClub(formData);
      setMessage('Registro exitoso. Serás redirigido al inicio de sesión.');
      setTimeout(() => navigate('/login'), 3000);
      
    } catch (err) {
        // ¡¡¡LÓGICA 'CATCH' MEJORADA!!!
        console.error("Error detallado:", err.response ? err.response.data : err.message);

        if (err.response && err.response.data) {
            const errorData = err.response.data;
            let specificError = "";

            if (errorData.username) {
                specificError = `Usuario: ${errorData.username[0]}`;
            } else if (errorData.email) {
                specificError = `Email: ${errorData.email[0]}`;
            } else if (errorData.club_name) {
                specificError = `Nombre de Club: ${errorData.club_name[0]}`;
            } else if (errorData.detail) {
                specificError = errorData.detail; // ej: "El grupo 'Club' no existe."
            } else {
                specificError = "Error no identificado. Verifique los campos.";
            }
            setError(specificError);

        } else {
            setError('Error de conexión con el servidor.');
        }
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white text-center">
              <h3 className="card-title mb-0">Registro de Nuevo Club</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                
                <h5 className="border-bottom pb-2">Credenciales de Acceso</h5>
                <div className="col-md-6">
                  <label className="form-label">Nombre de Usuario</label>
                  <input type="text" className="form-control" name="username" placeholder="Usuario" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Correo Electrónico</label>
                  <input type="email" className="form-control" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Contraseña</label>
                  <input type="password" className="form-control" name="password" placeholder="Contraseña" value={formData.password} required />
                </div>

                <h5 className="mt-4 border-bottom pb-2">Información del Club</h5>
                <div className="col-md-6">
                  <label className="form-label">Nombre del Club (Oficial)</label>
                  <input type="text" className="form-control" name="club_name" placeholder="Ej: Club de Tiro Cochabamba" value={formData.club_name} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Nombre del Presidente</label>
                  <input type="text" className="form-control" name="presidente_club" placeholder="Nombre completo" value={formData.presidente_club} onChange={handleChange} required />
                </div>

                <div className="col-12 mt-4">
                  {error && <div className="alert alert-danger">{error}</div>}
                  {message && <div className="alert alert-success">{message}</div>}
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-person-circle me-2"></i> Registrar Club
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;