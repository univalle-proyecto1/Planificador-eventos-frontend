import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { parseApiError } from '../utils/api';
import './Hoy.css';

export default function Progreso() {
	const navigate = useNavigate();
	const [eventos, setEventos] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');

	// Edit Event State
	const [editandoId, setEditandoId] = useState(null);
	const [editNombre, setEditNombre] = useState('');
	const [editHoras, setEditHoras] = useState(6);
	const [guardandoEdit, setGuardandoEdit] = useState(false);

	useEffect(() => {
		cargarEventos();
	}, []);

	async function cargarEventos() {
		setCargando(true);
		setError('');
		try {
			const response = await fetch('/api/eventos/');
			if (!response.ok) {
				const resJson = await response.json().catch(() => ({}));
				throw new Error(parseApiError(resJson, 'No se pudieron obtener los eventos.'));
			}
			const data = await response.json();
			setEventos(data);
		} catch (err) {
			setError(err.message || 'Error al conectar con el servidor.');
		} finally {
			setCargando(false);
		}
	}

	function iniciarEdicion(evento, e) {
		e.stopPropagation();
		setEditandoId(evento.id);
		setEditNombre(evento.nombre);
		setEditHoras(evento.limite_horas_diarias);
	}

	function cancelarEdicion(e) {
		if (e) e.stopPropagation();
		setEditandoId(null);
	}

	async function guardarEdicion(id, e) {
		e.stopPropagation();
		e.preventDefault();
		setGuardandoEdit(true);
		try {
			const csrfResponse = await fetch('/api/auth/csrf/');
			const csrfResult = await csrfResponse.json();

			const response = await fetch(`/api/eventos/${id}/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfResult.csrfToken || '',
				},
				body: JSON.stringify({
					nombre: editNombre.trim(),
					limite_horas_diarias: Number(editHoras),
				}),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(parseApiError(data, 'No se pudo actualizar el evento.'));
			}

			setEventos((actuales) =>
				actuales.map((evt) => (evt.id === id ? { ...evt, nombre: data.nombre, limite_horas_diarias: data.limite_horas_diarias } : evt))
			);
			setEditandoId(null);
		} catch (err) {
			alert(err.message);
		} finally {
			setGuardandoEdit(false);
		}
	}

	async function eliminarEvento(id, nombre, event) {
		event.stopPropagation();
		if (!window.confirm(`¿Estás seguro de eliminar el evento "${nombre}"?`)) return;

		try {
			const csrfResponse = await fetch('/api/auth/csrf/');
			const csrfResult = await csrfResponse.json();
			
			const response = await fetch(`/api/eventos/${id}/`, {
				method: 'DELETE',
				headers: {
					'X-CSRFToken': csrfResult.csrfToken || '',
				},
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(parseApiError(data, 'No se pudo eliminar el evento.'));
			}

			setEventos((actuales) => actuales.filter((e) => e.id !== id));
		} catch (err) {
			alert(err.message);
		}
	}

	return (
		<main className="create-event-page">
			<Header currentPage="progreso" />

			<section className="create-event-main" style={{ width: 'min(100% - 40px, 920px)' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
					<div>
						<p className="section-kicker">TABLERO · EVENTOS</p>
						<h1 style={{ margin: '6px 0', fontFamily: 'Georgia, serif', fontSize: '36px', color: '#263a31' }}>
							Mis Eventos
						</h1>
						<p style={{ margin: 0, color: '#718077', fontSize: '14px' }}>
							Gestiona las tareas y el avance de cada celebración.
						</p>
					</div>
					<button className="continue-button" onClick={() => navigate('/hoy')} style={{ minWidth: 'auto', gap: '10px' }}>
						+ Nuevo Evento
					</button>
				</div>

				{cargando ? (
					<div className="create-form-panel" style={{ textAlign: 'center', padding: '48px' }}>
						<p style={{ color: '#68776d', fontSize: '15px' }}>Cargando eventos desde el servidor...</p>
					</div>
				) : error ? (
					<div className="create-form-panel" style={{ textAlign: 'center', padding: '36px' }}>
						<p className="create-error" style={{ fontSize: '15px', marginBottom: '16px' }}>{error}</p>
						<button className="continue-button" onClick={cargarEventos} style={{ minWidth: 'auto' }}>
							Reintentar
						</button>
					</div>
				) : eventos.length === 0 ? (
					<div className="create-form-panel" style={{ textAlign: 'center', padding: '48px' }}>
						<span style={{ fontSize: '42px', display: 'block', marginBottom: '12px' }}>🎉</span>
						<h2 style={{ fontFamily: 'Georgia, serif', color: '#263a31', margin: '0 0 8px 0' }}>
							Aún no tienes eventos creados
						</h2>
						<p style={{ color: '#718077', marginBottom: '24px' }}>
							Empieza creando tu primer evento para organizar cada detalle.
						</p>
						<Link className="continue-button" to="/hoy" style={{ display: 'inline-flex', minWidth: 'auto' }}>
							Crear mi primer evento <span aria-hidden="true">→</span>
						</Link>
					</div>
				) : (
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
						{eventos.map((evento) => {
							const tareas = evento.tareas || [];
							const completadas = tareas.filter((t) => t.estado === 'HECHO').length;
							const porcentaje = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0;
							const esEditando = editandoId === evento.id;

							return (
								<div
									key={evento.id}
									className="create-form-panel"
									style={{
										marginTop: 0,
										padding: '24px',
										cursor: esEditando ? 'default' : 'pointer',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
										transition: 'transform 150ms ease, box-shadow 150ms ease',
									}}
									onClick={() => !esEditando && navigate(`/evento/${evento.id}`)}
								>
									{esEditando ? (
										<form onClick={(e) => e.stopPropagation()} onSubmit={(e) => guardarEdicion(evento.id, e)} style={{ display: 'grid', gap: '10px' }}>
											<h4 style={{ margin: 0, fontFamily: 'Georgia, serif', color: '#263a31' }}>✏️ Editar Evento</h4>
											<label style={{ fontSize: '11px', fontWeight: 'bold' }}>
												Nombre
												<input
													type="text"
													value={editNombre}
													onChange={(e) => setEditNombre(e.target.value)}
													required
													style={{ marginTop: '4px', padding: '6px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
												/>
											</label>
											<label style={{ fontSize: '11px', fontWeight: 'bold' }}>
												Límite diario (hrs)
												<input
													type="number"
													min="1"
													max="24"
													value={editHoras}
													onChange={(e) => setEditHoras(e.target.value)}
													required
													style={{ marginTop: '4px', padding: '6px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
												/>
											</label>
											<div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
												<button className="continue-button" type="submit" disabled={guardandoEdit} style={{ minWidth: 'auto', padding: '4px 12px', fontSize: '12px' }}>
													{guardandoEdit ? 'Guardando...' : 'Guardar'}
												</button>
												<button type="button" onClick={cancelarEdicion} style={{ background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 10px', fontSize: '12px' }}>
													Cancelar
												</button>
											</div>
										</form>
									) : (
										<>
											<div>
												<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
													<h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '22px', color: '#263a31' }}>
														{evento.nombre}
													</h3>
													<div style={{ display: 'flex', gap: '4px' }}>
														<button
															type="button"
															title="Editar evento"
															onClick={(e) => iniciarEdicion(evento, e)}
															style={{
																background: 'none',
																border: 'none',
																color: '#347554',
																cursor: 'pointer',
																fontSize: '14px',
																padding: '4px',
															}}
														>
															✏️
														</button>
														<button
															type="button"
															title="Eliminar evento"
															onClick={(e) => eliminarEvento(evento.id, evento.nombre, e)}
															style={{
																background: 'none',
																border: 'none',
																color: '#b34438',
																cursor: 'pointer',
																fontSize: '16px',
																padding: '4px 8px',
															}}
														>
															✕
														</button>
													</div>
												</div>

												<p style={{ fontSize: '12px', color: '#68776d', margin: '0 0 16px 0' }}>
													⏱️ Límite diario: <strong>{evento.limite_horas_diarias} hrs/día</strong>
												</p>

												<div style={{ marginBottom: '16px' }}>
													<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#34493c', marginBottom: '6px' }}>
														<span>Tareas: {completadas} / {tareas.length}</span>
														<span><strong>{porcentaje}%</strong></span>
													</div>
													<div style={{ background: '#e4e9df', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
														<div
															style={{
																background: '#246b4d',
																height: '100%',
																width: `${porcentaje}%`,
																transition: 'width 300ms ease',
															}}
														/>
													</div>
												</div>
											</div>

											<div style={{ borderTop: '1px solid #e2e8df', paddingTop: '14px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<span style={{ fontSize: '12px', color: '#246b4d', fontWeight: 'bold' }}>
													Ver y gestionar tareas →
												</span>
											</div>
										</>
									)}
								</div>
							);
						})}
					</div>
				)}
			</section>
		</main>
	);
}