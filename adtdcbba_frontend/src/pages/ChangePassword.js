import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const [pass, setPass] = useState({ new: '', confirm: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(pass.new !== pass.confirm) return alert("Las contraseñas no coinciden");
        try {
            await authService.api.post('users/change-password/', { password: pass.new });
            alert("Contraseña actualizada.");
            navigate('/dashboard'); // O a donde corresponda
        } catch(e) { alert("Error"); }
    };

    return (
        <div className="container mt-5 pt-5">
            <div className="card mx-auto" style={{maxWidth: '400px'}}>
                <div className="card-body">
                    <h4>Actualizar Contraseña</h4>
                    <p className="text-muted small">Por seguridad, debes cambiar tu contraseña temporal.</p>
                    <form onSubmit={handleSubmit}>
                        <input className="form-control mb-2" type="password" placeholder="Nueva Contraseña" onChange={e=>setPass({...pass, new:e.target.value})}/>
                        <input className="form-control mb-3" type="password" placeholder="Confirmar" onChange={e=>setPass({...pass, confirm:e.target.value})}/>
                        <button className="btn btn-primary w-100">Guardar y Entrar</button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default ChangePassword;