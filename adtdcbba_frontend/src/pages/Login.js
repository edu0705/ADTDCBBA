import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock } from 'react-icons/fa'; 
import logo from '../assets/logo.png'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      const userInfoRes = await authService.api.get('/users/user-info/');
      const userData = userInfoRes.data;
      const roles = userData.groups;
      login(roles);

      // 1. Verificar Cambio de Contraseña Obligatorio
      if (userData.force_password_change) {
          navigate('/change-password'); // Redirigir a pantalla de cambio
          return;
      }

      // 2. Redirección por Rol
      if (roles.includes('Presidente') || roles.includes('Tesorero')) navigate('/admin');
      else if (roles.includes('Club')) navigate('/dashboard');
      else if (roles.includes('Juez')) navigate('/juez');
      else if (roles.includes('Deportista')) navigate('/mi-perfil');
      else navigate('/login'); 

    } catch (err) {
      if (err.response && err.response.status === 401) setError('Credenciales incorrectas.');
      else setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
      <div className="card-elegant p-5 text-center fade-in" style={{ maxWidth: '400px', width: '90%', background: 'rgba(255, 255, 255, 0.95)' }}>
        <div className="mb-4">
          <img src={logo} alt="ADT" style={{ width: '100px', marginBottom: '15px' }} />
          <h3 className="fw-bold text-dark">Bienvenido</h3>
        </div>
        <form onSubmit={handleLogin}>
          <div className="input-group mb-3 shadow-sm rounded-pill overflow-hidden border"><span className="input-group-text bg-white border-0 ps-3"><FaUser className="text-primary"/></span><input type="text" className="form-control border-0 py-2" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
          <div className="input-group mb-4 shadow-sm rounded-pill overflow-hidden border"><span className="input-group-text bg-white border-0 ps-3"><FaLock className="text-primary"/></span><input type="password" className="form-control border-0 py-2" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {error && <div className="alert alert-danger py-2 small rounded-3 mb-3">{error}</div>}
          <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm" disabled={loading}>{loading ? '...' : 'INGRESAR'}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;