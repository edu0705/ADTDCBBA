// src/App.js
import React, { useLayoutEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Importaciones de Páginas
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterDeportista from './pages/RegisterDeportista';
import AdminDashboard from './pages/AdminDashboard';
import ManagePoligonos from './pages/ManagePoligonos';
import ManageJueces from './pages/ManageJueces';
import ManageModalidades from './pages/ManageModalidades';
import ManageCompetitions from './pages/ManageCompetitions';
import RegisterInscripcion from './pages/RegisterInscripcion';
import ManageInscripciones from './pages/ManageInscripciones';
import JudgePanel from './pages/JudgePanel'; 
import LiveScoreboard from './pages/LiveScoreboard'; 
import AdminLayout from './components/AdminLayout'; 
import ManageDeportistas from './pages/ManageDeportistas';
import DeportistaDetail from './pages/DeportistaDetail'; 
import CreateCompetencia from './pages/CreateCompetencia';
import MiPerfil from './pages/MiPerfil'; 
import ManageClubs from './pages/ManageClubs';
import ManageArmas from './pages/ManageArmas';

// Importa la lógica de autenticación
import { useAuth } from './context/AuthContext'; 

// --- ¡NUEVA IMPORTACIÓN DE CONSTANTES! ---
import { ROLES, ADMIN_ROLES } from './constants/roles';


// Componente de Navegación Condicional
const Navigation = () => {
    const { isLoggedIn, hasRole, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light w-100 px-3 border-bottom shadow-sm">
            <div className="container-fluid">
                <Link to="/" className="navbar-brand h1 mb-0 text-primary fw-bold">ADTDCBBA</Link>
                
                <div className="collapse navbar-collapse justify-content-end">
                    <ul className="navbar-nav">
                        
                        {!isLoggedIn && (
                            <li className="nav-item">
                                <Link to="/login" className="btn btn-primary btn-sm">Iniciar Sesión</Link>
                            </li>
                        )}

                        {isLoggedIn && (
                            <>
                                {/* Club */}
                                {hasRole(ROLES.CLUB) && (
                                    <>
                                        <li className="nav-item"><Link to="/dashboard" className="nav-link">Mi Club</Link></li>
                                        <li className="nav-item"><Link to="/register-deportista" className="nav-link">Reg. Deportista</Link></li>
                                        <li className="nav-item"><Link to="/register-inscripcion" className="nav-link">Inscribir</Link></li>
                                    </>
                                )}
                                
                                {/* Admin (Usando el array ADMIN_ROLES) */}
                                {ADMIN_ROLES.some(role => hasRole(role)) && (
                                    <>
                                        <li className="nav-item"><Link to="/admin" className="nav-link">Panel Admin</Link></li>
                                        <li className="nav-item"><Link to="/register-club" className="btn btn-outline-success btn-sm ms-2">Reg. Club</Link></li> 
                                    </>
                                )}
                                
                                {/* Juez */}
                                {hasRole(ROLES.JUEZ) && <li className="nav-item"><Link to="/juez" className="nav-link">Panel Juez</Link></li>}
                                
                                {/* Deportista */}
                                {hasRole(ROLES.DEPORTISTA) && <li className="nav-item"><Link to="/mi-perfil" className="nav-link">Mi Perfil</Link></li>}

                                {/* Común */}
                                <li className="nav-item"><Link to="/live-score" className="nav-link">Marcador en Vivo</Link></li>
                                
                                <li className="nav-item ms-3">
                                    <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">Cerrar Sesión</button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};


// Componente PrivateRoute (Sin cambios)
const PrivateRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (!loading) { 
        if (!isLoggedIn) {
            navigate('/login');
        } else if (!userRoles.includes(requiredRole)) {
            navigate('/unauthorized');
        }
    }
  }, [loading, isLoggedIn, userRoles, requiredRole, navigate]);
  
  if (loading || !isLoggedIn || !userRoles.includes(requiredRole)) {
      return <div className="text-center mt-5">Cargando o redirigiendo...</div>;
  }

  return children;
};


function App() {
  const { loading } = useAuth();
  
  if (loading) {
      return <div className="text-center mt-5">Cargando aplicación...</div>;
  }

  return (
    <Router>
      <div className="App-container">
        <header className="App-header p-0">
            <Navigation /> 
        </header>
        <div className="container-fluid">
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/live-score" element={<LiveScoreboard />} /> 
                
                {/* Rutas Protegidas (Club) */}
                <Route path="/dashboard" element={<PrivateRoute requiredRole={ROLES.CLUB}><Dashboard /></PrivateRoute>} />
                <Route path="/register-deportista" element={<PrivateRoute requiredRole={ROLES.CLUB}><RegisterDeportista /></PrivateRoute>} />
                <Route path="/register-inscripcion" element={<PrivateRoute requiredRole={ROLES.CLUB}><RegisterInscripcion /></PrivateRoute>} />
                
                {/* Rutas Protegidas (Administración) */}
                <Route path="/register-club" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><Register /></AdminLayout></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><AdminDashboard /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/poligonos" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManagePoligonos /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/jueces" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageJueces /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/modalidades" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageModalidades /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/competencias/crear" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><CreateCompetencia /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/deportistas" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageDeportistas /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/deportistas/:id" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><DeportistaDetail /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/competencias" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageCompetitions /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/inscripciones" element={<PrivateRoute requiredRole={ROLES.TESORERO}><AdminLayout><ManageInscripciones /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/clubs" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageClubs /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/armas" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageArmas /></AdminLayout></PrivateRoute>} />

                {/* Rutas Protegidas (Juez) */}
                <Route path="/juez" element={<PrivateRoute requiredRole={ROLES.JUEZ}><JudgePanel /></PrivateRoute>} />
                
                {/* Ruta Protegida (Deportista) */}
                <Route path="/mi-perfil" element={<PrivateRoute requiredRole={ROLES.DEPORTISTA}><MiPerfil /></PrivateRoute>} />

                {/* Rutas por Defecto y Error */}
                <Route path="/" element={<Login />} />
                <Route path="/unauthorized" element={<div className="container mt-5 alert alert-warning">No tienes permiso para acceder a esta página.</div>} />
                <Route path="*" element={<div className="container mt-5 alert alert-danger">Página no encontrada.</div>} />
            </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;