import React, { useState, useEffect } from 'react';
import Select from 'react-select'; 
import competenciaService from '../services/competenciaService';

const CreateCompetencia = () => {
  const [poligonos, setPoligonos] = useState([]);
  const [jueces, setJueces] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [archivoConvocatoria, setArchivoConvocatoria] = useState(null); 
  
  const [competenciaData, setCompetenciaData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    poligono: '',
    type: 'Departamental',
    modalidades_seleccionadas: [], 
    jueces: [],
    numero_convocatoria: '',
    hora_competencia: '08:00'
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // --- Lógica de Mapeo para React-Select (Ahora SÍ se usan abajo) ---
  const poligonoOptions = poligonos.map(p => ({ value: p.id, label: p.name }));
  const juezOptions = jueces.map(j => ({ value: j.id, label: j.full_name }));
  
  const modalidadOptions = modalidades.map(mod => ({
    label: mod.name,
    options: mod.categorias.map(cat => ({ value: cat.id, label: cat.name })),
    rawId: mod.id
  }));
  // ----------------------------------------


  // ¡FUNCIÓN CORREGIDA (para leer datos paginados)!
  const fetchData = async () => {
    try {
      const [poligonosRes, juecesRes, modalidadesRes, competenciasRes] = await Promise.all([
        competenciaService.getPoligonos(),
        competenciaService.getJueces(),
        competenciaService.getModalidades(),
        competenciaService.getCompetencias()
      ]);

      // Función auxiliar para extraer datos paginados
      const extractData = (response) => {
          if (response.data && response.data.results && Array.isArray(response.data.results)) {
              return response.data.results;
          }
          return Array.isArray(response.data) ? response.data : [];
      };

      setPoligonos(extractData(poligonosRes));
      setJueces(extractData(juecesRes));
      setModalidades(extractData(modalidadesRes));
      setCompetencias(extractData(competenciasRes)); 

    } catch (err) {
      setError("No se pudieron cargar los datos necesarios. Asegúrese de tener el rol 'Presidente'.");
    }
  };
  // --- FIN DE LA CORRECCIÓN ---


  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompetenciaData({ ...competenciaData, [name]: value });
  };
  
  const handleSelectChange = (selected, actionMeta) => {
    const name = actionMeta.name;
    let value = Array.isArray(selected) ? selected : (selected ? selected.value : '');
    setCompetenciaData({ ...competenciaData, [name]: value });
  };

  // ¡ESTA FUNCIÓN AHORA SÍ SE USA!
  const handleFileChange = (e) => {
    setArchivoConvocatoria(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const todasCategorias = competenciaData.modalidades_seleccionadas.flatMap(group => 
        group.options ? group.options.map(opt => opt.value) : (group.value ? [group.value] : [])
    );
    const juezIds = competenciaData.jueces.map(j => j.value);

    const dataToSend = {
      ...competenciaData,
      poligono: competenciaData.poligono,
      categorias: todasCategorias.map(id => parseInt(id)),
      jueces: juezIds.map(id => parseInt(id)),
    };

    const formData = new FormData();
    for (const key in dataToSend) {
        if (key === 'categorias' || key === 'jueces') {
            formData.append(key, JSON.stringify(dataToSend[key])); 
        } else if (key !== 'modalidades_seleccionadas') {
             formData.append(key, dataToSend[key]);
        }
    }
    
    if (archivoConvocatoria) {
        formData.append('archivo_convocatoria', archivoConvocatoria, archivoConvocatoria.name);
    }

    try {
      await competenciaService.createCompetencia(formData);
      setMessage("Competencia creada con éxito.");
      fetchData(); // Recargar datos
      
      setCompetenciaData({
        name: '', description: '', start_date: '', end_date: '', poligono: '',
        type: 'Departamental', jueces: [], modalidades_seleccionadas: [],
        numero_convocatoria: '', hora_competencia: '08:00'
      });
      setArchivoConvocatoria(null);

    } catch (err) {
      console.error("Error al crear competencia:", err.response ? err.response.data : err.message);
      if (err.response && err.response.data) {
          const errorData = err.response.data;
          let specificError = "";
          if (errorData.detail) {
              specificError = errorData.detail;
          } else if (errorData.name) {
              specificError = `Nombre: ${errorData.name[0]}`;
          } else {
              const firstKey = Object.keys(errorData)[0];
              specificError = `${firstKey}: ${errorData[firstKey][0]}`;
          }
          setError(`Error al crear competencia: ${specificError}`);
      } else {
          setError("Error de conexión con el servidor.");
      }
    }
  };
  
  const getPoligonoName = (id) => {
    const poligono = poligonoOptions.find(p => p.value === id);
    return poligono ? poligono.label : 'N/A';
  };

  return (
    <div className="container mt-4">
        <h2 className="mb-4 text-primary">Crear Nueva Competencia</h2>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card shadow-lg p-4">
            <form onSubmit={handleSubmit} className="row g-4">
                
                {/* Campos Simples */}
                <div className="col-md-6">
                    <label className="form-label">Nombre de la Competencia</label>
                    <input type="text" className="form-control" name="name" value={competenciaData.name} onChange={handleChange} required />
                </div>
                <div className="col-md-3">
                    <label className="form-label">Fecha de Inicio</label>
                    <input type="date" className="form-control" name="start_date" value={competenciaData.start_date} onChange={handleChange} required />
                </div>
                <div className="col-md-3">
                    <label className="form-label">Fecha de Fin</label>
                    <input type="date" className="form-control" name="end_date" value={competenciaData.end_date} onChange={handleChange} required />
                </div>

                <div className="col-12">
                    <label className="form-label">Descripción</label>
                    <textarea className="form-control" name="description" value={competenciaData.description} onChange={handleChange} rows="3"></textarea>
                </div>
                
                {/* SELECTORES REACT-SELECT AVANZADOS */}
                <div className="col-md-6">
                    <label className="form-label fw-bold">Polígono</label>
                    <Select 
                        name="poligono"
                        options={poligonoOptions}
                        value={poligonoOptions.find(p => p.value === competenciaData.poligono) || null}
                        onChange={(selected) => handleSelectChange(selected, { name: 'poligono' })}
                        placeholder="Seleccione un Polígono"
                        isClearable
                        required
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label fw-bold">Tipo de Competencia</label>
                    <select className="form-select" name="type" onChange={handleChange} value={competenciaData.type}>
                        <option value="Departamental">Departamental</option>
                        <option value="Nacional">Nacional</option>
                    </select>
                </div>

                <div className="col-12">
                    <label className="form-label fw-bold">Modalidades (Categorías incluídas)</label>
                    <Select 
                        name="modalidades_seleccionadas"
                        options={modalidadOptions}
                        value={competenciaData.modalidades_seleccionadas}
                        onChange={(selected) => handleSelectChange(selected, { name: 'modalidades_seleccionadas' })}
                        placeholder="Seleccione Modalidades"
                        isMulti
                        required
                    />
                    <div className="form-text">Al seleccionar la modalidad, se incluyen automáticamente todas sus categorías.</div>
                </div>
                
                {/* ¡ESTA ES LA PARTE QUE FALTABA! */}
                <div className="col-12">
                    <label className="form-label fw-bold">Jueces</label>
                    <Select 
                        name="jueces"
                        options={juezOptions}
                        value={competenciaData.jueces}
                        onChange={(selected) => handleSelectChange(selected, { name: 'jueces' })}
                        placeholder="Seleccione Jueces"
                        isMulti
                        required
                    />
                </div>
                
                {/* Campos de Convocatoria */}
                <h4 className="mt-5 border-bottom pb-2 text-secondary">Documentos y Horarios</h4>
                
                <div className="col-md-4">
                    <label className="form-label">Hora de la Competencia</label>
                    <input type="time" className="form-control" name="hora_competencia" value={competenciaData.hora_competencia} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                    <label className="form-label">Número de Convocatoria</label>
                    <input type="text" className="form-control" name="numero_convocatoria" value={competenciaData.numero_convocatoria} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                    <label className="form-label">Archivo Convocatoria (PDF)</label>
                    <input type="file" className="form-control" name="archivo_convocatoria" onChange={handleFileChange} />
                </div>

                {/* Este error se muestra si el handleSubmit falla */}
                {error && <div className="col-12"><div className="alert alert-danger">{error}</div></div>}
                
                <div className="col-12 mt-4">
                    <button type="submit" className="btn btn-primary w-100 btn-lg">
                        <i className="bi bi-trophy me-2"></i> Crear Competencia
                    </button>
                </div>
            </form>
        </div>
        
        {message && <div className="alert alert-success mt-4">{message}</div>}

        <hr className="my-5"/>
        
        {/* LISTADO DE COMPETENCIAS */}
        <h3>Competencias Existentes</h3>
        <table className="table table-striped table-hover">
            <thead className="table-dark">
                <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Polígono</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                {competencias.map(comp => (
                    <tr key={comp.id}>
                        <td>{comp.name}</td>
                        <td>{comp.type}</td>
                        <td>{getPoligonoName(comp.poligono)}</td>
                        <td><span className={`badge bg-${comp.status === 'Finalizada' ? 'danger' : (comp.status === 'En Progreso' ? 'success' : 'primary')}`}>{comp.status}</span></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default CreateCompetencia;