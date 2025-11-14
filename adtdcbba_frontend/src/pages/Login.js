// src/pages/Login.js
import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- ¡NUEVA IMPORTACIÓN!

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- Usa el hook del contexto para actualizar el estado

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authService.login(username, password);
      
      // Guarda los tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // OBTENER ROLES Y LLAMAR A login()
      const userInfoRes = await authService.api.get('/users/user-info/');
      const roles = userInfoRes.data.groups;

      login(roles); // <-- Establece el estado global: isLoggedIn=true

      // ¡REDIRECCIÓN MODIFICADA!
      if (roles.includes('Presidente') || roles.includes('Tesorero')) {
        navigate('/admin');
      } else if (roles.includes('Club')) {
        navigate('/dashboard');
      } else if (roles.includes('Juez')) {
        navigate('/juez');
      } else if (roles.includes('Deportista')) {
        // ¡NUEVA REDIRECCIÓN!
        navigate('/mi-perfil');
      } else {
        // Por defecto, si no tiene rol conocido
        navigate('/login'); 
      }

    } catch (err) {
      console.error(err);

      // --- INICIO DE LA MEJORA ---
      
      // Revisa si el error es un 401 (Credenciales inválidas)
      if (err.response && err.response.status === 401) {
        setError('Usuario o contraseña incorrectos.');
      } 
      // Si es cualquier otro error (500, error de red, etc.)
      else {
        setError('Error de conexión con el servidor. Por favor, inténtalo de nuevo más tarde.');
      }
      // --- FIN DE LA MEJORA ---
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-lg">
            <div className="card-header text-white bg-primary text-center">
              <h3 className="card-title">Iniciar Sesión</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Usuario</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre de Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button type="submit" className="btn btn-primary w-100">Entrar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;