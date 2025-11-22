import React, { useState, useEffect } from 'react';
import clubService from '../services/clubService';
import competenciaService from '../services/competenciaService';
import { FaShieldAlt, FaBullseye, FaPrint } from 'react-icons/fa';

const SystemReports = () => {
  const [clubs, setClubs] = useState([]);
  const [poligonos, setPoligonos] = useState([]);

  useEffect(() => {
     const load = async () => {
         try {
            const resC = await clubService.getAllClubs();
            setClubs(resC.data.results || resC.data);
            const resP = await competenciaService.api.get('poligonos/');
            setPoligonos(resP.data.results || resP.data);
         } catch(e) { console.error(e); }
     };
     load();
  }, []);

  return (
      <div className="container fade-in">
          <div className="d-flex justify-content-between mb-4">
              <h2 className="fw-bold">Reporte Institucional</h2>
              <button className="btn btn-dark rounded-pill" onClick={()=>window.print()}><FaPrint/> Imprimir</button>
          </div>
          
          <div className="row printable-area">
              <div className="col-md-6 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-primary text-white"><FaShieldAlt className="me-2"/> Clubes Afiliados ({clubs.length})</div>
                      <ul className="list-group list-group-flush">
                          {clubs.map(c => (
                              <li key={c.id} className="list-group-item">
                                  <strong>{c.name}</strong><br/><small className="text-muted">Pres: {c.presidente_club}</small>
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
              <div className="col-md-6 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-danger text-white"><FaBullseye className="me-2"/> Polígonos ({poligonos.length})</div>
                      <ul className="list-group list-group-flush">
                          {poligonos.map(p => <li key={p.id} className="list-group-item"><strong>{p.name}</strong><br/><small className="text-muted">{p.address}</small></li>)}
                      </ul>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default SystemReports;