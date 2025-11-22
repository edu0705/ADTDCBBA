import React, { useLayoutEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// --- PÁGINAS PRINCIPALES ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './components/AdminLayout'; 
import Register from './pages/Register'; 
import VerificationPortal from './pages/VerificationPortal';

// --- GESTIÓN DEPORTIVA ---
import ManageDeportistas from './pages/ManageDeportistas';
import RegisterDeportista from './pages/RegisterDeportista';
import RegisterGuest from './pages/RegisterGuest'; 
import DeportistaDetail from './pages/DeportistaDetail'; 
import ManageClubs from './pages/ManageClubs';
import ManageInscripciones from './pages/ManageInscripciones';
import RegisterInscripcion from './pages/RegisterInscripcion';
import CompetitionFinancials from './pages/CompetitionFinancials'; // <--- ¡ESTO FALTABA!

// --- GESTIÓN TÉCNICA ---
import ManageCompetitions from './pages/ManageCompetitions';
import CreateCompetencia from './pages/CreateCompetencia';
import ManageJueces from './pages/ManageJueces';
import ManagePoligonos from './pages/ManagePoligonos';
import ManageModalidades from './pages/ManageModalidades';
import ManageArmas from './pages/ManageArmas';

// --- OPERATIVO & REPORTES ---
import JudgePanel from './pages/JudgePanel'; 
import LiveScoreboard from './pages/LiveScoreboard'; 
import StartList from './pages/StartList';
import ResultsList from './pages/ResultsList';
import CompetitionResults from './pages/CompetitionResults';
import AnnualRanking from './pages/AnnualRanking';
import ClubRanking from './pages/ClubRanking';
import RecordsView from './pages/RecordsView';
import SystemReports from './pages/SystemReports';
import MiPerfil from './pages/MiPerfil'; 

import { useAuth } from './context/AuthContext'; 
import { ROLES, ADMIN_ROLES } from './constants/roles';

const PrivateRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (!loading) { 
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            const hasPermission = userRoles.includes(requiredRole) || 
                                  (requiredRole === ROLES.PRESIDENTE && ADMIN_ROLES.some(r => userRoles.includes(r)));
            if (!hasPermission) {
                console.warn(`Acceso denegado.`);
                navigate('/'); 
            }
        }
    }
  }, [loading, isLoggedIn, userRoles, requiredRole, navigate]);
  
  if (loading || !isLoggedIn) return <div className="text-center mt-5 p-5"><h1>Cargando...</h1></div>;
  return children;
};

function App() {
  const { loading } = useAuth();
  if (loading) return <div className="text-center mt-5">Iniciando...</div>;

  return (
    <Router>
        <div className="app-root">
            <Routes>
                {/* --- RUTAS PÚBLICAS --- */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Login />} />
                <Route path="/live-score" element={<LiveScoreboard />} /> 
                <Route path="/verificar" element={<VerificationPortal />} />

                {/* --- ZONA ADMIN --- */}
                <Route path="/admin" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><AdminDashboard /></AdminLayout></PrivateRoute>} />
                
                <Route path="/admin/competencias" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageCompetitions /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/competencias/crear" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><CreateCompetencia /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/planillas" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><StartList /></AdminLayout></PrivateRoute>} />
                
                <Route path="/admin/clubs" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageClubs /></AdminLayout></PrivateRoute>} />
                <Route path="/register-club" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><Register /></AdminLayout></PrivateRoute>} />
                
                <Route path="/admin/deportistas" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageDeportistas /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/deportistas/:id" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><DeportistaDetail /></AdminLayout></PrivateRoute>} />
                <Route path="/register-deportista" element={<PrivateRoute requiredRole={ROLES.CLUB}><AdminLayout><RegisterDeportista /></AdminLayout></PrivateRoute>} />
                <Route path="/register-guest" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><RegisterGuest /></AdminLayout></PrivateRoute>} />

                <Route path="/admin/inscripciones" element={<PrivateRoute requiredRole={ROLES.TESORERO}><AdminLayout><ManageInscripciones /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/finanzas" element={<PrivateRoute requiredRole={ROLES.TESORERO}><AdminLayout><CompetitionFinancials /></AdminLayout></PrivateRoute>} />
                <Route path="/register-inscripcion" element={<PrivateRoute requiredRole={ROLES.CLUB}><AdminLayout><RegisterInscripcion /></AdminLayout></PrivateRoute>} />

                <Route path="/admin/jueces" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageJueces /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/poligonos" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManagePoligonos /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/modalidades" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageModalidades /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/armas" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><ManageArmas /></AdminLayout></PrivateRoute>} />

                {/* --- REPORTES --- */}
                <Route path="/admin/resultados" element={<PrivateRoute requiredRole={ROLES.CLUB}><AdminLayout><ResultsList /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/resultados/:id" element={<PrivateRoute requiredRole={ROLES.CLUB}><AdminLayout><CompetitionResults /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/ranking-anual" element={<PrivateRoute requiredRole={ROLES.CLUB}><AdminLayout><AnnualRanking /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/ranking-clubes" element={<PrivateRoute requiredRole={ROLES.CLUB}><AdminLayout><ClubRanking /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/records" element={<PrivateRoute requiredRole={ROLES.CLUB}><AdminLayout><RecordsView /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/reportes-sistema" element={<PrivateRoute requiredRole={ROLES.PRESIDENTE}><AdminLayout><SystemReports /></AdminLayout></PrivateRoute>} />

                {/* --- OPERATIVO --- */}
                <Route path="/dashboard" element={<PrivateRoute requiredRole={ROLES.CLUB}><AdminLayout><Dashboard /></AdminLayout></PrivateRoute>} />
                <Route path="/juez" element={<PrivateRoute requiredRole={ROLES.JUEZ}><JudgePanel /></PrivateRoute>} />
                <Route path="/mi-perfil" element={<PrivateRoute requiredRole={ROLES.DEPORTISTA}><MiPerfil /></PrivateRoute>} />

                <Route path="*" element={<div className="p-5 text-center"><h3>404 - Página no encontrada</h3></div>} />
            </Routes>
        </div>
    </Router>
  );
}

export default App;