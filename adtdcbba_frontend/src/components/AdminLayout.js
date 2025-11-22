import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { 
  FaBars, FaTimes, FaHome, FaTrophy, FaUsers, 
  FaRunning, FaGavel, FaBullseye, FaSignOutAlt, 
  FaUserShield, FaList, FaCrosshairs, FaPlusCircle,
  FaTv, FaBalanceScale, FaClipboardList, FaUserPlus, FaEdit,
  FaBell, FaChevronDown, FaChevronRight, FaFileAlt,
  FaCrown, FaShieldAlt, FaGlobeAmericas, FaMoneyBillWave, FaLaptop
} from 'react-icons/fa';
import logo from '../assets/logo.png'; 
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await authService.api.get('/users/notifications/');
        setNotifications(res.data);
      } catch (error) { console.error("Error notificaciones", error); }
    };
    if (user) fetchNotifications();
  }, [user]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleSubMenu = (label) => setActiveMenu(prev => (prev === label ? null : label));
  const handleLogout = () => { logout(); navigate('/login'); };

  const menuStructure = [
    { path: '/admin', label: 'Dashboard Principal', icon: <FaHome />, type: 'link' },
    
    {
      label: 'Inscripciones', icon: <FaClipboardList />, type: 'submenu',
      items: [
        { path: '/admin/inscripciones', label: 'Ver Inscripciones', icon: <FaUsers /> },
        { path: '/admin/finanzas', label: 'Balance y Gastos', icon: <FaMoneyBillWave /> },
        { path: '/register-inscripcion', label: 'Nueva Inscripción Manual', icon: <FaPlusCircle /> },
      ]
    },
    {
      label: 'Reportes', icon: <FaFileAlt />, type: 'submenu',
      items: [
        { path: '/admin/resultados', label: 'Resultados Campeonatos', icon: <FaTrophy /> },
        { path: '/admin/ranking-anual', label: 'Ranking Anual Deportistas', icon: <FaRunning /> },
        { path: '/admin/ranking-clubes', label: 'Copa de Clubes', icon: <FaShieldAlt /> },
        { path: '/admin/records', label: 'Récords Departamentales', icon: <FaCrown /> },
        { path: '/admin/reportes-sistema', label: 'Reporte Institucional', icon: <FaList /> },
      ]
    },
    {
      label: 'Competencias', icon: <FaTrophy />, type: 'submenu',
      items: [
        { path: '/admin/competencias', label: 'Gestión Competencias' },
        { path: '/admin/competencias/crear', label: 'Nueva Competencia', icon: <FaPlusCircle /> },
        { path: '/admin/modalidades', label: 'Catálogo Modalidades', icon: <FaList /> },
        { path: '/admin/poligonos', label: 'Catálogo Polígonos', icon: <FaBullseye /> },
        { path: '/admin/jueces', label: 'Staff de Jueces', icon: <FaGavel /> },
        { path: '/admin/planillas', label: 'Planillas de Campo', icon: <FaList /> },
      ]
    },
    {
      label: 'Deportistas', icon: <FaRunning />, type: 'submenu',
      items: [
        { path: '/admin/deportistas', label: 'Directorio General' },
        { path: '/register-deportista', label: 'Registrar Local', icon: <FaUserPlus /> },
        { path: '/register-guest', label: 'Registrar Invitado', icon: <FaGlobeAmericas /> },
        { path: '/admin/armas', label: 'Inventario de Armas', icon: <FaCrosshairs /> },
      ]
    },
    {
      label: 'Clubes', icon: <FaUserShield />, type: 'submenu',
      items: [
        { path: '/admin/clubs', label: 'Listado de Clubes' },
        { path: '/register-club', label: 'Registrar Nuevo Club', icon: <FaEdit /> },
      ]
    },
    {
      label: 'Operativo / En Vivo', icon: <FaLaptop />, type: 'submenu',
      items: [
        { path: '/live-score', label: 'Pantalla TV (Resultados)', icon: <FaTv /> },
        { path: '/juez', label: 'Panel de Jueceo', icon: <FaBalanceScale /> },
      ]
    },
  ];

  return (
    <div className="admin-container">
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <img src={logo} alt="Logo ADT" className="logo-img" style={{width: '40px', height: '40px', objectFit: 'contain'}} />
            <div className="brand-text"><h3>ADTDCBBA</h3><small>Super Admin</small></div>
          </div>
          <button className="close-btn d-md-none" onClick={toggleSidebar}><FaTimes /></button>
        </div>

        <div className="sidebar-menu">
          <ul>
            {menuStructure.map((item, index) => (
              <li key={index}>
                {item.type === 'link' ? (
                  <Link to={item.path} className={`menu-link ${location.pathname === item.path ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                    <span className="icon">{item.icon}</span><span className="title">{item.label}</span>
                  </Link>
                ) : (
                  <>
                    <div className={`menu-link submenu-toggle ${activeMenu === item.label ? 'expanded' : ''}`} onClick={() => toggleSubMenu(item.label)}>
                      <div className="d-flex align-items-center"><span className="icon">{item.icon}</span><span className="title">{item.label}</span></div>
                      <span className="chevron">{activeMenu === item.label ? <FaChevronDown/> : <FaChevronRight/>}</span>
                    </div>
                    <ul className={`submenu-list ${activeMenu === item.label ? 'show' : ''}`}>
                      {item.items.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link to={subItem.path} className={`submenu-link ${location.pathname === subItem.path ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                            {subItem.icon && <span className="sub-icon">{subItem.icon}</span>}{subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
            <div className="mb-3 notification-btn-wrapper">
                <button className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2 border-0" style={{background: 'rgba(255,255,255,0.1)'}} onClick={() => setShowNotifications(!showNotifications)}>
                    <FaBell /> Notificaciones {notifications.length > 0 && <span className="badge-counter">{notifications.length}</span>}
                </button>
                {showNotifications && (
                    <div className="notifications-panel">
                        <div className="notifications-header"><span>Alertas ({notifications.length})</span><button className="btn btn-sm text-secondary p-0" onClick={() => setShowNotifications(false)}><FaTimes/></button></div>
                        <div className="notifications-body">
                            {notifications.length === 0 ? <div className="p-3 text-center text-muted small">No hay alertas</div> : notifications.map((notif, idx) => (
                                <Link key={idx} to={notif.link || '#'} className={`notification-item notif-${notif.type}`} onClick={() => setShowNotifications(false)}>
                                    <span className="notif-title">{notif.title}</span><span className="notif-msg">{notif.message}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="user-info-mini">
                <div className="avatar-circle-mini">{(user?.username || 'A').charAt(0).toUpperCase()}</div>
                <span className="username-mini">{user?.username || 'Admin'}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn"><FaSignOutAlt /> <span>Salir</span></button>
        </div>
      </aside>

      <main className="main-content">
        <button className="menu-toggle-floating d-md-none" onClick={toggleSidebar}><FaBars /></button>
        <div className="content-body fade-in">{children}</div>
      </main>

      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </div>
  );
};

export default AdminLayout;