// src/components/AdminLayout.js

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const AdminLayout = ({ children }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="d-flex" id="wrapper">
            {/* Sidebar (Panel Lateral) */}
            <div className="bg-dark text-white border-end" id="sidebar-wrapper" style={{ width: '250px', minHeight: '100vh', position: 'fixed', zIndex: 100 }}>
                <div className="sidebar-heading bg-primary py-4 text-center fw-bold fs-5">
                    Panel Admin ADTDCBBA
                </div>
                <div className="list-group list-group-flush">
                    <Link to="/admin" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-house me-2"></i> Dashboard
                    </Link>
                    
                    {/* --- GESTIÓN DE FLUJO --- */}
                    <Link to="/admin/deportistas" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-person-check me-2"></i> Aprobar Deportistas
                    </Link>
                    <Link to="/admin/inscripciones" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-card-checklist me-2"></i> Gestionar Inscripciones
                    </Link>

                    {/* --- GESTIÓN DE DATOS --- */}
                    <Link to="/admin/competencias/crear" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-calendar-plus me-2"></i> Crear Competencia
                    </Link>
                    <Link to="/admin/poligonos" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-geo-alt me-2"></i> Gestionar Polígonos
                    </Link>
                    <Link to="/admin/jueces" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-person-badge me-2"></i> Gestionar Jueces
                    </Link>
                    <Link to="/admin/modalidades" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-list-check me-2"></i> Gestionar Modalidades
                    </Link>

                    {/* --- NUEVOS REPORTES AÑADIDOS --- */}
                    <Link to="/admin/clubs" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-shield-check me-2"></i> Reporte de Clubes
                    </Link>
                    <Link to="/admin/armas" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-archive me-2"></i> Reporte de Armas
                    </Link>
                    
                    {/* --- CIERRE --- */}
                    <Link to="/admin/competencias" className="list-group-item list-group-item-action bg-dark text-white border-0 py-3">
                        <i className="bi bi-trophy me-2"></i> Cierre de Competencias
                    </Link>
                </div>
            </div>

            {/* Page Content (Contenido Principal) */}
            <div id="page-content-wrapper" className="flex-grow-1 bg-light" style={{ marginLeft: '250px' }}>
                <nav className="navbar navbar-light bg-light border-bottom">
                    <div className="container-fluid justify-content-end">
                        <button onClick={handleLogout} className="btn btn-danger btn-sm">
                            <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                        </button>
                    </div>
                </nav>

                <div className="container-fluid py-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;