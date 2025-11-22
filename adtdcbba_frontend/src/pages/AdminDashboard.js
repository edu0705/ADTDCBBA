import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaUsers, FaUserShield, FaCalendarAlt, FaPlus, FaArrowRight } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Datos simulados para el diseño (luego puedes conectarlos a la API real)
  const stats = [
    { title: 'Competencias Activas', value: '3', icon: <FaTrophy />, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { title: 'Inscripciones Pendientes', value: '12', icon: <FaCalendarAlt />, color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', text: '#d9534f' },
    { title: 'Deportistas Registrados', value: '150+', icon: <FaUsers />, color: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', text: '#2c3e50' },
    { title: 'Clubes Afiliados', value: '8', icon: <FaUserShield />, color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  ];

  return (
    <div>
      {/* Encabezado de Bienvenida */}
      <div className="d-flex justify-content-between align-items-center mb-5 fade-in">
        <div>
          <h2 className="fw-bold text-dark mb-1">Panel de Control</h2>
          <p className="text-muted mb-0">Bienvenido de nuevo, {user?.username || 'Admin'}</p>
        </div>
        <div className="d-flex gap-3">
            <Link to="/register-club" className="btn btn-light shadow-sm rounded-pill px-4 fw-bold text-primary">
                <FaUserShield className="me-2"/> Nuevo Club
            </Link>
            <Link to="/admin/competencias/crear" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                <FaPlus className="me-2"/> Crear Competencia
            </Link>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="row mb-5 fade-in">
        {stats.map((stat, index) => (
          <div key={index} className="col-md-3 mb-4">
            <div className="card border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4 position-relative">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted fw-bold text-uppercase small mb-2">{stat.title}</p>
                    <h2 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>{stat.value}</h2>
                  </div>
                  <div 
                    className="d-flex align-items-center justify-content-center text-white shadow" 
                    style={{ 
                        width: '50px', height: '50px', borderRadius: '15px', 
                        background: stat.color, fontSize: '1.2rem' 
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de Contenido Dividido */}
      <div className="row fade-in">
        {/* Próximas Competencias */}
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
            <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold m-0 text-dark">Próximas Competencias</h5>
                <Link to="/admin/competencias" className="text-primary text-decoration-none small fw-bold">Ver todas <FaArrowRight/></Link>
            </div>
            <div className="card-body px-4 pb-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle table-borderless">
                        <thead className="text-muted small text-uppercase">
                            <tr>
                                <th>Evento</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Filas de Ejemplo (luego vendrán de la API) */}
                            <tr className="border-bottom">
                                <td className="fw-bold text-dark py-3">Copa Nacional 2025</td>
                                <td className="text-muted">15 Nov, 2025</td>
                                <td><span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">Activa</span></td>
                                <td><Link to="/live-score" className="btn btn-sm btn-outline-primary rounded-pill">Ver Marcador</Link></td>
                            </tr>
                            <tr>
                                <td className="fw-bold text-dark py-3">Tiro al Vuelo - Departamental</td>
                                <td className="text-muted">22 Nov, 2025</td>
                                <td><span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3">Próxima</span></td>
                                <td><button className="btn btn-sm btn-light rounded-pill text-muted">Editar</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        </div>

        {/* Accesos Rápidos / Estado del Sistema */}
        <div className="col-lg-4 mb-4">
            <div className="card border-0 shadow-sm h-100 text-white" style={{ borderRadius: '20px', background: 'linear-gradient(180deg, #4e73df 0%, #224abe 100%)' }}>
                <div className="card-body p-4 d-flex flex-column justify-content-center text-center">
                    <div className="mb-4">
                        <div className="bg-white bg-opacity-25 rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                            <FaCalendarAlt style={{ fontSize: '2rem' }} />
                        </div>
                        <h4 className="fw-bold">Gestión Rápida</h4>
                        <p className="small text-white-50">Administra los registros pendientes</p>
                    </div>
                    <div className="d-grid gap-3">
                        <Link to="/admin/inscripciones" className="btn btn-light fw-bold text-primary rounded-pill py-2">
                            Revisar Inscripciones
                        </Link>
                        <Link to="/admin/jueces" className="btn btn-outline-light fw-bold rounded-pill py-2">
                            Gestionar Jueces
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;