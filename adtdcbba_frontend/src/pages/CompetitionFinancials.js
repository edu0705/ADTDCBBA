import React, { useState, useEffect, useCallback } from 'react';
import competenciaService from '../services/competenciaService';
import { 
  FaMoneyBillWave, FaArrowDown, FaArrowUp, FaPlus, FaTrash, 
  FaPrint, FaChartPie, FaCoins 
} from 'react-icons/fa';

const CompetitionFinancials = () => {
  const [competencias, setCompetencias] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  
  // Datos Financieros
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formulario Nuevo Gasto
  const [newGasto, setNewGasto] = useState({ descripcion: '', monto: '' });

  useEffect(() => {
    const loadComps = async () => {
        try {
            const res = await competenciaService.getCompetencias();
            setCompetencias(res.data.results || res.data);
        } catch (err) { console.error(err); }
    };
    loadComps();
  }, []);

  // --- CORRECCIÓN: Usamos useCallback para estabilizar la función ---
  const loadFinancialData = useCallback(async () => {
      if (!selectedComp) return;
      setLoading(true);
      try {
          // 1. Cargar Ingresos (Inscripciones pagadas)
          const resInsc = await competenciaService.getInscripciones();
          const allInsc = resInsc.data.results || resInsc.data;
          const compIngresos = allInsc.filter(i => 
              i.competencia === parseInt(selectedComp) && parseFloat(i.monto_pagado) > 0
          );
          setIngresos(compIngresos);

          // 2. Cargar Gastos
          const resGastos = await competenciaService.getGastos();
          const allGastos = resGastos.data.results || resGastos.data;
          const compGastos = allGastos.filter(g => g.competencia === parseInt(selectedComp));
          setGastos(compGastos);

      } catch (err) { console.error(err); }
      finally { setLoading(false); }
  }, [selectedComp]);

  // --- CORRECCIÓN: Agregamos la dependencia al array ---
  useEffect(() => {
      loadFinancialData();
  }, [loadFinancialData]);

  const handleAddGasto = async (e) => {
      e.preventDefault();
      if(!newGasto.descripcion || !newGasto.monto) return;
      try {
          await competenciaService.createGasto({
              competencia: selectedComp,
              descripcion: newGasto.descripcion,
              monto: newGasto.monto
          });
          setNewGasto({ descripcion: '', monto: '' });
          loadFinancialData();
      } catch (err) { alert("Error al registrar gasto"); }
  };

  const handleDeleteGasto = async (id) => {
      if(window.confirm("¿Eliminar este gasto?")) {
          try {
              await competenciaService.deleteGasto(id);
              loadFinancialData();
          } catch (err) { alert("Error al eliminar"); }
      }
  };

  // --- CÁLCULOS ---
  const totalIngresos = ingresos.reduce((acc, i) => acc + parseFloat(i.monto_pagado), 0);
  const totalGastos = gastos.reduce((acc, g) => acc + parseFloat(g.monto), 0);
  const balance = totalIngresos - totalGastos;

  return (
    <div className="container fade-in pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <div>
            <h2 className="fw-bold text-dark mb-1">Balance Económico</h2>
            <p className="text-muted">Gestión de Ingresos, Egresos y Utilidades.</p>
          </div>
          <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={()=>window.print()} disabled={!selectedComp}>
              <FaPrint className="me-2"/> Imprimir Informe
          </button>
      </div>

      {/* Selector */}
      <div className="card-elegant p-4 mb-5 no-print">
          <label className="fw-bold mb-2">Seleccionar Competencia:</label>
          <select className="form-select" value={selectedComp} onChange={e=>setSelectedComp(e.target.value)}>
              <option value="">-- Seleccione --</option>
              {competencias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
      </div>

      {/* --- CORRECCIÓN: Usamos la variable loading --- */}
      {loading && (
          <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="mt-2 text-muted">Calculando balance...</p>
          </div>
      )}

      {selectedComp && !loading && (
          <div className="printable-area">
              {/* TARJETAS DE RESUMEN */}
              <div className="row mb-5">
                  <div className="col-md-4">
                      <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100">
                          <div className="card-body text-center p-4">
                              <FaArrowUp className="text-success mb-2" size={24}/>
                              <h5 className="text-success fw-bold">Total Ingresos</h5>
                              <h2 className="fw-bold text-dark">{totalIngresos.toFixed(2)} Bs</h2>
                              <small className="text-muted">{ingresos.length} pagos registrados</small>
                          </div>
                      </div>
                  </div>
                  <div className="col-md-4">
                      <div className="card border-0 shadow-sm bg-danger bg-opacity-10 h-100">
                          <div className="card-body text-center p-4">
                              <FaArrowDown className="text-danger mb-2" size={24}/>
                              <h5 className="text-danger fw-bold">Total Gastos</h5>
                              <h2 className="fw-bold text-dark">{totalGastos.toFixed(2)} Bs</h2>
                              <small className="text-muted">{gastos.length} items registrados</small>
                          </div>
                      </div>
                  </div>
                  <div className="col-md-4">
                      <div className={`card border-0 shadow-sm h-100 ${balance >= 0 ? 'bg-primary bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                          <div className="card-body text-center p-4">
                              <FaCoins className={balance >= 0 ? 'text-primary mb-2' : 'text-warning mb-2'} size={24}/>
                              <h5 className={balance >= 0 ? 'text-primary fw-bold' : 'text-warning fw-bold'}>Balance Final</h5>
                              <h2 className="fw-bold text-dark">{balance.toFixed(2)} Bs</h2>
                              <small className="text-muted">{balance >= 0 ? 'Superávit' : 'Déficit'}</small>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="row">
                  {/* DETALLE DE INGRESOS */}
                  <div className="col-md-6 mb-4">
                      <div className="card-elegant h-100">
                          <div className="card-header-elegant bg-success text-white d-flex justify-content-between align-items-center">
                              <span className="fw-bold"><FaMoneyBillWave className="me-2"/> Detalle Ingresos</span>
                          </div>
                          <div className="card-body p-0">
                              <div className="table-responsive" style={{maxHeight: '400px'}}>
                                  <table className="table table-hover mb-0 small">
                                      <thead className="table-light sticky-top">
                                          <tr><th>Deportista</th><th className="text-end">Monto</th></tr>
                                      </thead>
                                      <tbody>
                                          {ingresos.map(i => (
                                              <tr key={i.id}>
                                                  <td>{i.deportista_nombre} {i.deportista_apellido}</td>
                                                  <td className="text-end text-success fw-bold">+{i.monto_pagado}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* GESTIÓN DE GASTOS */}
                  <div className="col-md-6 mb-4">
                      <div className="card-elegant h-100">
                          <div className="card-header-elegant bg-danger text-white d-flex justify-content-between align-items-center">
                              <span className="fw-bold"><FaChartPie className="me-2"/> Detalle Gastos</span>
                          </div>
                          <div className="card-body p-3">
                              {/* Formulario Agregar Gasto */}
                              <form onSubmit={handleAddGasto} className="d-flex gap-2 mb-3 no-print">
                                  <input type="text" className="form-control form-control-sm" placeholder="Descripción (ej: Almuerzo)" value={newGasto.descripcion} onChange={e=>setNewGasto({...newGasto, descripcion: e.target.value})} required/>
                                  <input type="number" className="form-control form-control-sm" placeholder="Monto" style={{maxWidth:'100px'}} value={newGasto.monto} onChange={e=>setNewGasto({...newGasto, monto: e.target.value})} required/>
                                  <button type="submit" className="btn btn-danger btn-sm"><FaPlus/></button>
                              </form>

                              <div className="table-responsive" style={{maxHeight: '350px'}}>
                                  <table className="table table-hover mb-0 small">
                                      <thead className="table-light sticky-top">
                                          <tr><th>Concepto</th><th className="text-end">Monto</th><th className="text-end no-print" style={{width:'30px'}}></th></tr>
                                      </thead>
                                      <tbody>
                                          {gastos.map(g => (
                                              <tr key={g.id}>
                                                  <td>{g.descripcion} <small className="text-muted d-block">{g.fecha}</small></td>
                                                  <td className="text-end text-danger fw-bold">-{g.monto}</td>
                                                  <td className="text-end no-print">
                                                      <button className="btn btn-sm text-danger p-0" onClick={()=>handleDeleteGasto(g.id)}><FaTrash/></button>
                                                  </td>
                                              </tr>
                                          ))}
                                          {gastos.length === 0 && <tr><td colSpan="3" className="text-center text-muted py-3">Sin gastos registrados.</td></tr>}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CompetitionFinancials;