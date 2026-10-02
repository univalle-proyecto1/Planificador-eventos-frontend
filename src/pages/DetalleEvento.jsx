import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { parseApiError } from '../utils/api';
import './Hoy.css';

export default function DetalleEvento() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [evento, setEvento] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');

	// Formulario para nueva tarea
	const [titulo, setTitulo] = useState('');
	const [fechaAsignada, setFechaAsignada] = useState(new Date().toISOString().split('T')[0]);
	const [horasEstimadas, setHorasEstimadas] = useState('2');
	const [prioridad, setPrioridad] = useState('NORMAL');
	const [guardandoTarea, setGuardandoTarea] = useState(false);
	const [errorTarea, setErrorTarea] = useState('');

	// Estado para edición de tareas
	const [editandoTareaId, setEditandoTareaId] = useState(null);
	const [editTitulo, setEditTitulo] = useState('');
	const [editFecha, setEditFecha] = useState('');
	const [editHoras, setEditHoras] = useState('2');
	const [editPrioridad, setEditPrioridad] = useState('NORMAL');
	const [editEstado, setEditEstado] = useState('PENDIENTE');
	const [guardandoEditTarea, setGuardandoEditTarea] = useState(false);

	useEffect(() => {
		cargarEvento();
	}, [id]);

	async function cargarEvento() {
		setCargando(true);
		setError('');
		try {
			const response = await fetch(`/api/eventos/${id}/`);
			if (!response.ok) {
				const resJson = await response.json().catch(() => ({}));
				throw new Error(parseApiError(resJson, 'No se pudo cargar el evento especificado.'));
			}
			const data = await response.json();
			setEvento(data);
		} catch (err) {
			setError(err.message || 'Error al obtener el evento.');
		} finally {
			setCargando(false);
		}
	}

	function calcularHorasFecha(fecha, ignorarTareaId = null) {
		if (!evento || !evento.tareas) return 0;
		return evento.tareas
			.filter((t) => t.fecha_asignada === fecha && t.id !== ignorarTareaId)
			.reduce((total, t) => total + Number(t.horas_estimadas), 0);
	}

	async function handleCrearTarea(e) {
		e.preventDefault();
		setErrorTarea('');

		const horasNuevas = Number(horasEstimadas);
		if (isNaN(horasNuevas) || horasNuevas <= 0) {
			setErrorTarea('Ingresa una cantidad de horas estimadas válida.');
			return;
		}

		const horasActuales = calcularHorasFecha(fechaAsignada);
		const limite = Number(evento.limite_horas_diarias);

		if (horasActuales + horasNuevas > limite) {
			setErrorTarea(
				`⚠️ Límite excedido: Para la fecha ${fechaAsignada} ya tienes ${horasActuales} hrs ocupadas. ` +
				`Sumar ${horasNuevas} hrs superaría el límite de ${limite} hrs/día del evento.`
			);
			return;
		}

		setGuardandoTarea(true);
		try {
			const csrfResponse = await fetch('/api/auth/csrf/');
			const csrfResult = await csrfResponse.json();

			const response = await fetch('/api/tareas/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfResult.csrfToken || '',
				},
				body: JSON.stringify({
					evento: Number(id),
					titulo: titulo.trim(),
					fecha_asignada: fechaAsignada,
					horas_estimadas: horasNuevas,
					prioridad: prioridad,
					estado: 'PENDIENTE',
				}),
			});

			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(parseApiError(result, 'No se pudo crear la tarea logística.'));
			}

			setTitulo('');
			setHorasEstimadas('2');
			await cargarEvento();
		} catch (err) {
			setErrorTarea(err.message || 'Error al guardar la tarea.');
		} finally {
			setGuardandoTarea(false);
		}
	}

	function iniciarEdicionTarea(tarea) {
		setEditandoTareaId(tarea.id);
		setEditTitulo(tarea.titulo);
		setEditFecha(tarea.fecha_asignada);
		setEditHoras(String(tarea.horas_estimadas));
		setEditPrioridad(tarea.prioridad);
		setEditEstado(tarea.estado);
	}

	function cancelarEdicionTarea() {
		setEditandoTareaId(null);
	}

	async function handleGuardarEditTarea(tareaId, e) {
		e.preventDefault();
		setErrorTarea('');
		setGuardandoEditTarea(true);

		try {
			const csrfResponse = await fetch('/api/auth/csrf/');
			const csrfResult = await csrfResponse.json();

			const response = await fetch(`/api/tareas/${tareaId}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfResult.csrfToken || '',
				},
				body: JSON.stringify({
					titulo: editTitulo.trim(),
					fecha_asignada: editFecha,
					horas_estimadas: Number(editHoras),
					prioridad: editPrioridad,
					estado: editEstado,
				}),
			});

			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(parseApiError(result, 'No se pudo actualizar la tarea.'));
			}

			setEditandoTareaId(null);
			await cargarEvento();
		} catch (err) {
			setErrorTarea(err.message || 'Error al actualizar la tarea.');
		} finally {
			setGuardandoEditTarea(false);
		}
	}

	async function cambiarEstadoTarea(tareaId, nuevoEstado) {
		try {
			const csrfResponse = await fetch('/api/auth/csrf/');
			const csrfResult = await csrfResponse.json();

			const response = await fetch(`/api/tareas/${tareaId}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfResult.csrfToken || '',
				},
				body: JSON.stringify({ estado: nuevoEstado }),
			});

			if (response.ok) {
				await cargarEvento();
			}
		} catch (err) {
			console.error('Error al actualizar estado:', err);
		}
	}

	async function eliminarTarea(tareaId) {
		if (!window.confirm('¿Deseas eliminar esta tarea?')) return;
		try {
			const csrfResponse = await fetch('/api/auth/csrf/');
			const csrfResult = await csrfResponse.json();

			const response = await fetch(`/api/tareas/${tareaId}/`, {
				method: 'DELETE',
				headers: {
					'X-CSRFToken': csrfResult.csrfToken || '',
				},
			});

			if (response.ok) {
				await cargarEvento();
			}
		} catch (err) {
			console.error('Error al eliminar tarea:', err);
		}
	}

	const horasSeleccionadas = calcularHorasFecha(fechaAsignada);
	const limiteDiario = evento ? Number(evento.limite_horas_diarias) : 0;

	return (
		<main className="create-event-page">
			<Header currentPage="progreso" />

			<section className="create-event-main" style={{ width: 'min(100% - 40px, 920px)' }}>
				<Link className="create-back" to="/progreso">← Volver a Mis Eventos</Link>

				{cargando ? (
					<div className="create-form-panel" style={{ textAlign: 'center', padding: '48px' }}>
						<p style={{ color: '#68776d' }}>Cargando detalles del evento...</p>
					</div>
				) : error ? (
					<div className="create-form-panel" style={{ textAlign: 'center', padding: '36px' }}>
						<p className="create-error" style={{ marginBottom: '16px' }}>{error}</p>
						<button className="continue-button" onClick={() => navigate('/progreso')} style={{ minWidth: 'auto' }}>
							Regresar al tablero
						</button>
					</div>
				) : evento ? (
					<div style={{ marginTop: '20px' }}>
						{/* Encabezado del Evento */}
						<div className="create-form-panel" style={{ marginTop: 0, marginBottom: '24px', padding: '28px' }}>
							<p className="section-kicker">DETALLES DEL EVENTO</p>
							<h1 style={{ fontSize: '38px', margin: '4px 0 8px 0', color: '#263a31' }}>{evento.nombre}</h1>
							<div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#68776d', flexWrap: 'wrap' }}>
								<span>⏱️ Límite diario: <strong>{evento.limite_horas_diarias} hrs/día</strong></span>
								<span>📋 Tareas totales: <strong>{evento.tareas ? evento.tareas.length : 0}</strong></span>
							</div>
						</div>

						{/* Formulario de Agregar Tarea */}
						<div className="create-form-panel" style={{ marginBottom: '24px', padding: '28px' }}>
							<h3 style={{ margin: '0 0 16px 0', fontFamily: 'Georgia, serif', color: '#263a31', fontSize: '20px' }}>
								➕ Agregar Tarea Logística
							</h3>
							<form onSubmit={handleCrearTarea} style={{ display: 'grid', gap: '14px' }}>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
									<label style={{ color: '#34493c', fontSize: '12px', fontWeight: 'bold' }}>
										Título de la tarea
										<input
											type="text"
											required
											placeholder="Ej. Contratar banquete"
											value={titulo}
											onChange={(e) => setTitulo(e.target.value)}
											style={{ marginTop: '4px', width: '100%', padding: '8px 12px', border: '1px solid #dce4db', borderRadius: '5px' }}
										/>
									</label>

									<label style={{ color: '#34493c', fontSize: '12px', fontWeight: 'bold' }}>
										Fecha asignada
										<input
											type="date"
											required
											value={fechaAsignada}
											onChange={(e) => setFechaAsignada(e.target.value)}
											style={{ marginTop: '4px', width: '100%', padding: '8px 12px', border: '1px solid #dce4db', borderRadius: '5px' }}
										/>
									</label>

									<label style={{ color: '#34493c', fontSize: '12px', fontWeight: 'bold' }}>
										Horas estimadas
										<input
											type="number"
											step="0.5"
											min="0.5"
											max="24"
											required
											value={horasEstimadas}
											onChange={(e) => setHorasEstimadas(e.target.value)}
											style={{ marginTop: '4px', width: '100%', padding: '8px 12px', border: '1px solid #dce4db', borderRadius: '5px' }}
										/>
									</label>

									<label style={{ color: '#34493c', fontSize: '12px', fontWeight: 'bold' }}>
										Prioridad
										<select
											value={prioridad}
											onChange={(e) => setPrioridad(e.target.value)}
											style={{ marginTop: '4px', width: '100%', padding: '8px 12px', border: '1px solid #dce4db', borderRadius: '5px', background: '#fff' }}
										>
											<option value="NORMAL">Normal</option>
											<option value="ALTA">Alta</option>
											<option value="CRITICA">Crítica</option>
										</select>
									</label>
								</div>

								{/* Indicador de límite de horas */}
								<div style={{ background: horasSeleccionadas + Number(horasEstimadas) > limiteDiario ? '#fdf2f0' : '#f0f7ef', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#263a31' }}>
									📅 Ocupación el <strong>{fechaAsignada}</strong>: {horasSeleccionadas} hrs ocupadas + {horasEstimadas} hrs nueva = <strong>{horasSeleccionadas + Number(horasEstimadas)} / {limiteDiario} hrs</strong>
								</div>

								{errorTarea && <p className="create-error" style={{ margin: 0 }}>{errorTarea}</p>}

								<button
									className="continue-button"
									type="submit"
									disabled={guardandoTarea || !titulo.trim()}
									style={{ justifySelf: 'start', minWidth: '160px' }}
								>
									{guardandoTarea ? 'Guardando...' : 'Guardar Tarea'}
								</button>
							</form>
						</div>

						{/* Lista de Tareas */}
						<div className="create-form-panel" style={{ padding: '28px' }}>
							<h3 style={{ margin: '0 0 18px 0', fontFamily: 'Georgia, serif', color: '#263a31', fontSize: '20px' }}>
								📌 Lista de Tareas Logísticas ({evento.tareas ? evento.tareas.length : 0})
							</h3>

							{!evento.tareas || evento.tareas.length === 0 ? (
								<p style={{ color: '#718077', fontSize: '14px', fontStyle: 'italic', margin: 0 }}>
									No hay tareas asignadas a este evento aún. Agrega una arriba.
								</p>
							) : (
								<div style={{ display: 'grid', gap: '12px' }}>
									{evento.tareas.map((tarea) => {
										const prioridadColor = {
											NORMAL: '#e0ecdb',
											ALTA: '#ffead8',
											CRITICA: '#fce2e6',
										}[tarea.prioridad] || '#eee';
										const esEditandoTarea = editandoTareaId === tarea.id;

										return (
											<div
												key={tarea.id}
												style={{
													padding: '14px 16px',
													border: '1px solid #e4e9df',
													borderRadius: '6px',
													background: '#fff',
												}}
											>
												{esEditandoTarea ? (
													<form onSubmit={(e) => handleGuardarEditTarea(tarea.id, e)} style={{ display: 'grid', gap: '10px' }}>
														<h4 style={{ margin: 0, fontSize: '14px', color: '#263a31' }}>✏️ Editar Tarea</h4>
														<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
															<label style={{ fontSize: '11px', fontWeight: 'bold' }}>
																Título
																<input
																	type="text"
																	required
																	value={editTitulo}
																	onChange={(e) => setEditTitulo(e.target.value)}
																	style={{ marginTop: '4px', width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
																/>
															</label>
															<label style={{ fontSize: '11px', fontWeight: 'bold' }}>
																Fecha
																<input
																	type="date"
																	required
																	value={editFecha}
																	onChange={(e) => setEditFecha(e.target.value)}
																	style={{ marginTop: '4px', width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
																/>
															</label>
															<label style={{ fontSize: '11px', fontWeight: 'bold' }}>
																Horas
																<input
																	type="number"
																	step="0.5"
																	min="0.5"
																	max="24"
																	required
																	value={editHoras}
																	onChange={(e) => setEditHoras(e.target.value)}
																	style={{ marginTop: '4px', width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
																/>
															</label>
															<label style={{ fontSize: '11px', fontWeight: 'bold' }}>
																Prioridad
																<select
																	value={editPrioridad}
																	onChange={(e) => setEditPrioridad(e.target.value)}
																	style={{ marginTop: '4px', width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
																>
																	<option value="NORMAL">Normal</option>
																	<option value="ALTA">Alta</option>
																	<option value="CRITICA">Crítica</option>
																</select>
															</label>
															<label style={{ fontSize: '11px', fontWeight: 'bold' }}>
																Estado
																<select
																	value={editEstado}
																	onChange={(e) => setEditEstado(e.target.value)}
																	style={{ marginTop: '4px', width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
																>
																	<option value="PENDIENTE">Pendiente</option>
																	<option value="EN_PROGRESO">En Progreso</option>
																	<option value="HECHO">Hecho ✓</option>
																	<option value="POSPUESTO">Pospuesto</option>
																</select>
															</label>
														</div>
														<div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
															<button className="continue-button" type="submit" disabled={guardandoEditTarea} style={{ minWidth: 'auto', padding: '4px 12px', fontSize: '12px' }}>
																{guardandoEditTarea ? 'Guardando...' : 'Guardar Cambios'}
															</button>
															<button type="button" onClick={cancelarEdicionTarea} style={{ background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 10px', fontSize: '12px' }}>
																Cancelar
															</button>
														</div>
													</form>
												) : (
													<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
														<div style={{ flex: '1 1 250px' }}>
															<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
																<strong style={{ fontSize: '15px', color: '#263a31' }}>{tarea.titulo}</strong>
																<span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: prioridadColor, fontWeight: 'bold', color: '#263a31' }}>
																	{tarea.prioridad}
																</span>
															</div>
															<div style={{ fontSize: '12px', color: '#68776d', display: 'flex', gap: '16px' }}>
																<span>📅 {tarea.fecha_asignada}</span>
																<span>⏱️ {tarea.horas_estimadas} hrs</span>
															</div>
														</div>

														<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
															<select
																value={tarea.estado}
																onChange={(e) => cambiarEstadoTarea(tarea.id, e.target.value)}
																style={{
																	padding: '6px 10px',
																	fontSize: '12px',
																	borderRadius: '5px',
																	border: '1px solid #dce4db',
																	fontWeight: 'bold',
																	color: tarea.estado === 'HECHO' ? '#176b52' : '#263a31',
																	background: tarea.estado === 'HECHO' ? '#e2f0d9' : '#fff',
																}}
															>
																<option value="PENDIENTE">Pendiente</option>
																<option value="EN_PROGRESO">En Progreso</option>
																<option value="HECHO">Hecho ✓</option>
																<option value="POSPUESTO">Pospuesto</option>
															</select>

															<button
																type="button"
																onClick={() => iniciarEdicionTarea(tarea)}
																style={{
																	background: 'none',
																	border: 'none',
																	color: '#347554',
																	cursor: 'pointer',
																	fontSize: '14px',
																	padding: '4px 6px',
																}}
																title="Editar tarea"
															>
																✏️
															</button>

															<button
																type="button"
																onClick={() => eliminarTarea(tarea.id)}
																style={{
																	background: 'none',
																	border: 'none',
																	color: '#b34438',
																	cursor: 'pointer',
																	fontSize: '16px',
																	padding: '4px 8px',
																}}
																title="Eliminar tarea"
															>
																✕
															</button>
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				) : null}
			</section>
		</main>
	);
}