import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import deportistaService from '../services/deportistaService';
import { FaSave, FaGlobeAmericas, FaIdCard } from 'react-icons/fa'; // <-- FaUserPlus ELIMINADO

const RegisterGuest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', apellido_paterno: '', apellido_materno: '',
    ci: '', birth_date: '', genero: 'M', telefono: '',
    departamento_origen: '', // Campo clave
    es_invitado: true,       // Campo clave
    status: 'Activo'         // Activo por defecto
  });

  const departamentos = ['La Paz', 'Santa Cruz', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando', 'Exterior'];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          // 1. Crear Invitado
          const res = await deportistaService.createDeportista(formData);
          const newId = res.data.id;

          // 2. Generar Acceso
          const authRes = await deportistaService.api.post(`deportistas/${newId}/approve/`);
          
          alert(`✅ INVITADO REGISTRADO\n\nUsuario: ${authRes.data.username}\nContraseña: ${authRes.data.password}`);
          navigate('/admin/deportistas');
      } catch (err) {
          alert("Error al registrar. Revise el CI.");
      } finally { setLoading(false); }
  };

  return (
    <div className="container fade-in py-4">
      <div className="card-elegant mx-auto" style={{ maxWidth: '800px' }}>
        <div className="card-header-elegant bg-info text-white">
          <h4 className="m-0"><FaGlobeAmericas className="me-2"/> Registro Deportista Invitado (Nacional)</h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
                <div className="col-md-6"><label className="small fw-bold text-muted">Nombres</label><input className="form-control" name="first_name" onChange={handleChange} required /></div>
                <div className="col-md-6"><label className="small fw-bold text-muted">Apellidos</label><input className="form-control" name="apellido_paterno" onChange={handleChange} required /></div>
                <div className="col-md-6"><label className="small fw-bold text-muted">CI / Pasaporte</label><input className="form-control" name="ci" onChange={handleChange} required /></div>
                <div className="col-md-6"><label className="small fw-bold text-muted">Departamento / País</label><select className="form-select" name="departamento_origen" onChange={handleChange} required><option value="">-- Seleccione --</option>{departamentos.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div className="col-md-6"><label className="small fw-bold text-muted">Fecha Nacimiento</label><input type="date" className="form-control" name="birth_date" onChange={handleChange} required /></div>
                <div className="col-md-6"><label className="small fw-bold text-muted">Género</label><select className="form-select" name="genero" onChange={handleChange}><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
            </div>
            <div className="alert alert-light mt-4 border small"><FaIdCard className="me-2"/> Al guardar, se generará usuario y contraseña.</div>
            <div className="mt-3 text-end">
                <button type="button" className="btn btn-light rounded-pill px-4 me-2" onClick={() => navigate(-1)}>Cancelar</button>
                <button type="submit" className="btn btn-info text-white rounded-pill px-5 fw-bold shadow-sm" disabled={loading}>{loading ? '...' : <><FaSave className="me-2"/> Registrar</>}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterGuest;