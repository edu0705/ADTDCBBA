import React, { useState, useEffect } from 'react';
import deportistaService from '../services/deportistaService'; // Usamos el servicio que ya tiene searchArmas
import { FaCrosshairs, FaSearch, FaFilePdf, FaUser } from 'react-icons/fa';

const ManageArmas = () => {
  const [armas, setArmas] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reutilizamos el buscador con query vacía para traer todo
    const load = async () => {
        try {
            const res = await deportistaService.searchArmas('');
            setArmas(res.data.results || res.data);
        } catch(err) { console.error(err); } 
        finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = armas.filter(a => 
      a.marca.toLowerCase().includes(filter.toLowerCase()) ||
      a.numero_matricula.toLowerCase().includes(filter.toLowerCase()) ||
      (a.deportista_nombre && a.deportista_nombre.toLowerCase().includes(filter.toLowerCase()))
  );

  if (loading) return <div className="text-center p-5">Cargando inventario...</div>;

  return (
    <div className="container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Inventario de Armas</h2>
        <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={() => window.print()}>
            <FaFilePdf className="me-2"/> Imprimir Reporte
        </button>
      </div>

      <div className="card-elegant mb-4 p-3 no-print">
        <div className="input-group border-0 bg-light rounded-pill overflow-hidden">
            <span className="input-group-text border-0 bg-transparent ps-3"><FaSearch className="text-muted"/></span>
            <input type="text" className="form-control border-0 bg-transparent" placeholder="Buscar por Marca, Matrícula o Propietario..." value={filter} onChange={e=>setFilter(e.target.value)}/>
        </div>
      </div>

      <div className="card-elegant p-0 overflow-hidden">
          <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-uppercase small text-muted">
                      <tr>
                          <th className="ps-4 py-3">Arma</th>
                          <th>Calibre</th>
                          <th>Matrícula</th>
                          <th>Propietario</th>
                          <th className="text-end pe-4">Inspección</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filtered.map(arma => (
                          <tr key={arma.id}>
                              <td className="ps-4 fw-bold text-dark">
                                  <FaCrosshairs className="text-muted me-2"/>
                                  {arma.marca} {arma.modelo}
                              </td>
                              <td><span className="badge bg-light text-dark border">{arma.calibre}</span></td>
                              <td className="font-monospace">{arma.numero_matricula}</td>
                              <td>
                                  <div className="d-flex align-items-center gap-2">
                                      <FaUser className="text-primary small"/>
                                      {arma.deportista_nombre || 'Desconocido'}
                                  </div>
                              </td>
                              <td className="text-end pe-4">
                                  {arma.fecha_inspeccion ? (
                                      <span className={new Date(arma.fecha_inspeccion) < new Date() ? 'text-danger fw-bold' : 'text-success'}>
                                          {arma.fecha_inspeccion}
                                      </span>
                                  ) : <span className="text-warning">Pendiente</span>}
                              </td>
                          </tr>
                      ))}
                      {filtered.length === 0 && <tr><td colSpan="5" className="text-center p-5 text-muted">No se encontraron armas.</td></tr>}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default ManageArmas;