import React, { useState } from 'react';
import axios from 'axios';
import { FaSearch, FaIdCard, FaCrosshairs, FaCertificate, FaCheckCircle, FaTimesCircle, FaUserShield } from 'react-icons/fa';
import logo from '../assets/logo.png';

const VerificationPortal = () => {
  const [tab, setTab] = useState('deportista');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/';

  const handleSearch = async (e) => {
    e.preventDefault();
    if(!query.trim()) return;
    setLoading(true); setResult(null); setError('');

    try {
        const res = await axios.get(`${API_URL}deportistas/verify/?type=${tab}&q=${query}`);
        setResult(res.data);
    } catch (err) {
        setError(err.response?.data?.detail || "No se encontraron registros.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column align-items-center py-5">
        <div className="text-center mb-5 fade-in">
            <img src={logo} alt="ADT" style={{width: '80px'}} className="mb-3"/>
            <h2 className="fw-bold text-dark">Portal de Verificación Oficial</h2>
            <p className="text-muted">Sistema de Consultas - ADTDCBBA</p>
        </div>

        <div className="card border-0 shadow-lg rounded-4 overflow-hidden w-100" style={{maxWidth: '700px'}}>
            <div className="card-header bg-white border-0 p-1">
                <ul className="nav nav-pills nav-fill p-2 bg-light rounded-pill mx-3 mt-3">
                    <li className="nav-item">
                        {/* USO DE ICONOS DE PESTAÑA */}
                        <button className={`nav-link rounded-pill fw-bold ${tab==='deportista'?'active bg-primary':''}`} onClick={()=>{setTab('deportista'); setResult(null); setError(''); setQuery('');}}>
                            <FaUserShield className="me-2"/> Deportista
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link rounded-pill fw-bold ${tab==='arma'?'active bg-danger':''}`} onClick={()=>{setTab('arma'); setResult(null); setError(''); setQuery('');}}>
                            <FaCrosshairs className="me-2"/> Arma
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link rounded-pill fw-bold ${tab==='certificado'?'active bg-warning text-dark':''}`} onClick={()=>{setTab('certificado'); setResult(null); setError(''); setQuery('');}}>
                            <FaCertificate className="me-2"/> Certificado
                        </button>
                    </li>
                </ul>
            </div>
            
            <div className="card-body p-5">
                <form onSubmit={handleSearch} className="mb-4">
                    <label className="form-label fw-bold text-muted small">
                        {tab === 'deportista' && 'Ingrese CI o Código Único (ADT-202X...)'}
                        {tab === 'arma' && 'Ingrese Número de Matrícula'}
                        {tab === 'certificado' && 'Ingrese Código de Verificación (UUID)'}
                    </label>
                    <div className="input-group input-group-lg">
                        <input type="text" className="form-control rounded-start-pill ps-4" placeholder="Escriba aquí..." value={query} onChange={e=>setQuery(e.target.value)} autoFocus/>
                        <button className={`btn rounded-end-pill px-4 ${tab==='deportista'?'btn-primary':tab==='arma'?'btn-danger':'btn-warning'}`} type="submit">
                            {loading ? '...' : <FaSearch/>}
                        </button>
                    </div>
                </form>

                {/* ERROR CON ICONO */}
                {error && (
                    <div className="alert alert-danger rounded-4 text-center fade-in">
                        <FaTimesCircle className="me-2"/> {error}
                    </div>
                )}

                {result && tab === 'deportista' && (
                    <div className="fade-in text-center">
                        {result.foto_url && <img src={result.foto_url} className="rounded-circle mb-3 shadow border border-4 border-white" style={{width:'120px', height:'120px', objectFit:'cover'}} alt="Foto"/>}
                        <h3 className="fw-bold text-dark">{result.nombre}</h3>
                        <span className={`badge fs-6 mb-3 ${result.estado==='Activo'?'bg-success':'bg-danger'}`}>{result.estado}</span>
                        
                        <div className="row text-start bg-light p-3 rounded-4 border mb-3">
                            <div className="col-6 mb-2"><small className="text-muted">Código Único</small><div className="fw-bold text-primary">{result.codigo_unico || 'S/N'}</div></div>
                            <div className="col-6 mb-2"><small className="text-muted">CI</small><div className="fw-bold">{result.ci}</div></div>
                            <div className="col-6"><small className="text-muted">Club</small><div className="fw-bold">{result.club}</div></div>
                            <div className="col-6"><small className="text-muted">Licencia B</small><div className={`fw-bold ${new Date(result.licencia_b_vencimiento) < new Date() ? 'text-danger' : 'text-success'}`}>{result.licencia_b_vencimiento}</div></div>
                        </div>
                    </div>
                )}
                
                {result && tab === 'arma' && (
                     <div className="fade-in">
                         <div className="alert alert-success rounded-4 text-center"><FaCheckCircle className="me-2"/> Arma Registrada</div>
                         <div className="row text-start bg-light p-4 rounded-4 border">
                             <div className="col-12 mb-3 text-center"><h4 className="fw-bold">{result.marca_modelo}</h4><span className="badge bg-dark">{result.calibre}</span></div>
                             <div className="col-6 mb-2"><small className="text-muted">Matrícula</small><div className="fw-bold font-monospace">{result.matricula}</div></div>
                             <div className="col-6 mb-2"><small className="text-muted">Propietario</small><div className="fw-bold text-primary">{result.propietario}</div></div>
                         </div>
                     </div>
                )}

                {result && tab === 'certificado' && (
                    <div className="fade-in text-center border p-4 rounded-4" style={{background: '#fff8e1'}}>
                         <FaCertificate size={50} className="text-warning mb-3"/>
                         <h4 className="fw-bold text-dark">CERTIFICADO AUTÉNTICO</h4>
                         <p className="text-success fw-bold mb-4"><FaCheckCircle/> Documento Oficial</p>
                         <div className="text-start small">
                             <strong>Deportista:</strong> {result.deportista}<br/>
                             <strong>Competencia:</strong> {result.competencia}<br/>
                             <strong>Puntaje:</strong> {result.puntaje}
                         </div>
                    </div>
                )}
            </div>
        </div>
        
        <div className="mt-5 text-muted small text-center">
            <p>© {new Date().getFullYear()} ADTDCBBA</p>
            <a href="/login" className="text-decoration-none text-primary"><FaIdCard className="me-1"/> Acceso Administrativo</a>
        </div>
    </div>
  );
};

export default VerificationPortal;