import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Hoy.css';
import './DetalleEvento.css';

const API = 'http://127.0.0.1:8000';

const ESTADO_LABEL = {
	PENDIENTE:   { label: 'PENDIENTE',   cls: 'badge-proxima' },
	EN_PROGRESO: { label: 'EN PROGRESO', cls: 'badge-hoy' },
	HECHO:       { label: 'HECHO',       cls: 'badge-hecho' },
	POSPUESTO:   { label: 'POSPUESTO',   cls: 'badge-pospuesto' },
};

function TareaFila({ tarea, onEstado, onEliminar, onEditar }) {
	const { label, cls } = ESTADO_LABEL[tarea.estado] || ESTADO_LABEL.PENDIENTE;
	const [editando, setEditando] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [form, setForm] = useState({
		titulo: tarea.titulo,
		fecha_asignada: tarea.fecha_asignada,
		hora_asignada: tarea.hora_asignada || '',
	});

	async function handleSubmit(event) {
		event.preventDefault();
		setGuardando(true);
		const actualizado = await onEditar(tarea.id, { ...form, titulo: form.titulo.trim() });
		setGuardando(false);
		if (actualizado) setEditando(false);
	}

	return (
		<>
			<div className="det-tarea">
				<div className="det-tarea-info">
					<span className="det-tarea-titulo">{tarea.titulo}</span>
					<span className="det-tarea-meta">
						📅 {tarea.fecha_asignada}{tarea.hora_asignada && ` · ${tarea.hora_asignada.slice(0, 5)}`} · ⏱ {tarea.horas_estimadas}h · {tarea.prioridad}
					</span>
				</div>
				<span className={`prog-badge ${cls}`}>{label}</span>
				<div className="det-tarea-actions">
					<button className="prog-action" onClick={() => setEditando(value => !value)} type="button" title={editando ? 'Cerrar el formulario sin guardar' : 'Cambiar el nombre, fecha u hora de esta subtarea'}>
						{editando ? 'Cancelar' : 'Editar'}
					</button>
					{tarea.estado !== 'HECHO' && (
						<button className="prog-action prog-action-primary" onClick={() => onEstado(tarea.id, 'HECHO')} title="Marcar la subtarea como completada">
							✓ Hecho
						</button>
					)}
					{tarea.estado === 'PENDIENTE' && (
						<button className="prog-action" onClick={() => onEstado(tarea.id, 'EN_PROGRESO')} title="Marcar la subtarea como en progreso">
							↻ En progreso
						</button>
					)}
					<button className="prog-action prog-action-icon det-btn-eliminar" onClick={() => onEliminar(tarea.id)} title="Eliminar esta subtarea">
						✕
					</button>
				</div>
			</div>
			{editando && (
				<form className="det-form det-tarea-form" onSubmit={handleSubmit}>
					<div className="det-form-grid">
						<label className="det-label">
							Nombre de la subtarea
							<input className="det-input" maxLength={200} onChange={event => setForm({ ...form, titulo: event.target.value })} required value={form.titulo} />
						</label>
						<label className="det-label">
							Fecha
							<input className="det-input" onChange={event => setForm({ ...form, fecha_asignada: event.target.value })} required type="date" value={form.fecha_asignada} />
						</label>
						<label className="det-label">
							Hora
							<input className="det-input" onChange={event => setForm({ ...form, hora_asignada: event.target.value })} type="time" value={form.hora_asignada} />
						</label>
					</div>
					<button className="prog-action prog-action-primary" disabled={guardando} type="submit" title="Guardar los cambios de la subtarea">
						{guardando ? 'Guardando…' : 'Guardar cambios'}
					</button>
				</form>
			)}
		</>
	);
}

const FORM_INICIAL = { titulo: '', fecha_asignada: '', hora_asignada: '', horas_estimadas: '', prioridad: 'NORMAL' };

export default function DetalleEvento() {
	const { id } = useParams();
	const [evento, setEvento] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');
	const [form, setForm] = useState(FORM_INICIAL);
	const [formError, setFormError] = useState('');
	const [guardando, setGuardando] = useState(false);
	const [abrirForm, setAbrirForm] = useState(false);
	const [editarEvento, setEditarEvento] = useState(false);
	const [formEvento, setFormEvento] = useState({ nombre: '', fecha_evento: '', hora_evento: '' });

	const cargar = useCallback(async () => {
		setCargando(true);
		setError('');
		try {
			const res = await fetch(`${API}/api/eventos/${id}/`, { credentials: 'include' });
			if (!res.ok) throw new Error('No se encontró el evento.');
			setEvento(await res.json());
		} catch (e) {
			setError(e.message);
		} finally {
			setCargando(false);
		}
	}, [id]);

	useEffect(() => { cargar(); }, [cargar]);

	function handleChange(e) {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
		setFormError('');
	}

	async function handleEditarEvento(e) {
		e.preventDefault();
		if (!formEvento.nombre.trim()) return setFormError('Escribe un nombre para el evento.');
		setGuardando(true);
		setFormError('');
		try {
			const csrfRes = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfRes.json();
			const res = await fetch(`${API}/api/eventos/${id}/`, {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
				body: JSON.stringify({
					nombre: formEvento.nombre.trim(),
					fecha_evento: formEvento.fecha_evento || null,
					hora_evento: formEvento.hora_evento || null,
				}),
			});
			if (!res.ok) throw new Error('No se pudo actualizar el evento.');
			setEditarEvento(false);
			await cargar();
		} catch (err) {
			setFormError(err.message);
		} finally {
			setGuardando(false);
		}
	}

	async function handleAgregarTarea(e) {
		e.preventDefault();
		if (!form.titulo.trim()) return setFormError('Escribe un nombre para la tarea.');
		if (!form.fecha_asignada)  return setFormError('Selecciona una fecha.');
		if (!form.horas_estimadas || Number(form.horas_estimadas) <= 0)
			return setFormError('Ingresa las horas estimadas.');

		setGuardando(true);
		setFormError('');
		try {
			const csrfRes = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfRes.json();

			const res = await fetch(`${API}/api/tareas/`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
				body: JSON.stringify({
					evento: Number(id),
					titulo: form.titulo.trim(),
					fecha_asignada: form.fecha_asignada,
					hora_asignada: form.hora_asignada || null,
					horas_estimadas: Number(form.horas_estimadas),
					prioridad: form.prioridad,
				}),
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = Array.isArray(result?.non_field_errors)
					? result.non_field_errors[0]
					: result?.detail || JSON.stringify(result);
				throw new Error(msg);
			}
			setForm(FORM_INICIAL);
			setAbrirForm(false);
			cargar();
		} catch (err) {
			setFormError(err.message);
		} finally {
			setGuardando(false);
		}
	}

	async function handleEditarTarea(tareaId, cambios) {
		try {
			const csrfRes = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfRes.json();
			const res = await fetch(`${API}/api/tareas/${tareaId}/`, {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
				body: JSON.stringify({ ...cambios, hora_asignada: cambios.hora_asignada || null }),
			});
			if (!res.ok) throw new Error('No se pudo actualizar la subtarea.');
			await cargar();
			return true;
		} catch (err) {
			setError(err.message);
			return false;
		}
	}

	async function handleEstado(tareaId, nuevoEstado) {
		try {
			const csrfRes = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfRes.json();
			await fetch(`${API}/api/tareas/${tareaId}/`, {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
				body: JSON.stringify({ estado: nuevoEstado }),
			});
			cargar();
		} catch { setError('No se pudo actualizar la tarea.'); }
	}

	async function handleEliminar(tareaId) {
		if (!confirm('¿Eliminar esta tarea?')) return;
		try {
			const csrfRes = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfRes.json();
			await fetch(`${API}/api/tareas/${tareaId}/`, {
				method: 'DELETE',
				credentials: 'include',
				headers: { 'X-CSRFToken': csrfToken },
			});
			cargar();
		} catch { setError('No se pudo eliminar la tarea.'); }
	}

	const tareas = evento?.tareas || [];
	const hechas = tareas.filter(t => t.estado === 'HECHO').length;
	const pct = tareas.length > 0 ? Math.round((hechas / tareas.length) * 100) : 0;

	return (
		<main className="create-event-page">
			<header className="event-topbar">
				<Link className="event-brand" to="/crear-evento" aria-label="EventPro, inicio">
					<span className="event-brand-mark" aria-hidden="true">E</span>
					<span>EventPro</span>
				</Link>
				<nav className="event-nav" aria-label="Navegación principal">
					<Link to="/crear-evento">Crear evento</Link>
					<span className="event-nav-current" aria-current="page">Mis eventos</span>
					<Link to="/hoy">Hoy</Link>
				</nav>
				<span className="event-user-mark" aria-label="Tu perfil">EP</span>
			</header>

			<div className="det-container">
				<Link className="create-back" to="/progreso">← Volver a mis eventos</Link>

				{cargando && <p className="det-cargando">Cargando…</p>}
				{error && <p className="det-error" role="alert">{error}</p>}

				{evento && (
					<>
						{/* ── Cabecera del evento ── */}
						<div className="det-header">
							<div>
								<p className="section-kicker">DETALLE DEL EVENTO</p>
								<h1 className="det-titulo">{evento.nombre}</h1>
								{(evento.fecha_evento || evento.hora_evento) && (
									<p className="det-meta">
										{evento.fecha_evento || 'Fecha pendiente'}{evento.hora_evento && ` · ${evento.hora_evento.slice(0, 5)}`}
									</p>
								)}
								<p className="det-meta">
									{tareas.length} tarea{tareas.length !== 1 ? 's' : ''}
									{tareas.length > 0 && ` · ${pct}% completado`}
									{` · Límite ${evento.limite_horas_diarias}h/día`}
								</p>
							</div>
							<div className="det-header-actions">
								<button
									className="prog-action det-btn-nueva"
									title="Editar el nombre, fecha y hora del evento"
									onClick={() => {
										setFormEvento({ nombre: evento.nombre, fecha_evento: evento.fecha_evento || '', hora_evento: evento.hora_evento || '' });
										setEditarEvento(value => !value);
									}}
									type="button"
								>
									{editarEvento ? 'Cancelar edición' : 'Editar evento'}
								</button>
								<button
									className="prog-action prog-action-primary det-btn-nueva"
									title={abrirForm ? 'Cerrar el formulario de nueva tarea' : 'Agregar una subtarea a este evento'}
									onClick={() => setAbrirForm(v => !v)}
									type="button"
								>
									{abrirForm ? '✕ Cancelar' : '+ Nueva tarea'}
								</button>
							</div>
						</div>

						{editarEvento && (
							<form className="det-form" onSubmit={handleEditarEvento}>
								<h2 className="det-form-titulo">Editar evento</h2>
								<div className="det-form-grid">
									<label className="det-label">
										Nombre del evento
										<input className="det-input" maxLength={200} onChange={e => setFormEvento({ ...formEvento, nombre: e.target.value })} required value={formEvento.nombre} />
									</label>
									<label className="det-label">
										Fecha
										<input className="det-input" onChange={e => setFormEvento({ ...formEvento, fecha_evento: e.target.value })} type="date" value={formEvento.fecha_evento} />
									</label>
									<label className="det-label">
										Hora
										<input className="det-input" onChange={e => setFormEvento({ ...formEvento, hora_evento: e.target.value })} type="time" value={formEvento.hora_evento} />
									</label>
								</div>
								{formError && <p className="det-form-error" role="alert">{formError}</p>}
								<button className="prog-action prog-action-primary" disabled={guardando} type="submit" title="Guardar los cambios del evento">
									{guardando ? 'Guardando…' : 'Guardar cambios'}
								</button>
							</form>
						)}

						{/* ── Barra de progreso ── */}
						{tareas.length > 0 && (
							<div className="prog-barra-wrap det-barra">
								<div className="prog-barra">
									<div className="prog-barra-fill" style={{ width: `${pct}%` }} />
								</div>
								<span className="prog-barra-pct">{pct}%</span>
							</div>
						)}

						{/* ── Formulario nueva tarea ── */}
						{abrirForm && (
							<form className="det-form" onSubmit={handleAgregarTarea}>
								<h2 className="det-form-titulo">Nueva tarea</h2>
								<div className="det-form-grid">
									<label className="det-label">
										Nombre de la tarea
										<input
											className="det-input"
											name="titulo"
											value={form.titulo}
											onChange={handleChange}
											placeholder="Ej. Contratar catering"
											maxLength={200}
											required
										/>
									</label>
									<label className="det-label">
										Fecha objetivo
										<input
											className="det-input"
											type="date"
											name="fecha_asignada"
											value={form.fecha_asignada}
											onChange={handleChange}
											required
										/>
									</label>
									<label className="det-label">
										Horas estimadas
										<input
											className="det-input"
											type="number"
											name="horas_estimadas"
											value={form.horas_estimadas}
											onChange={handleChange}
											min="0.5"
											max="24"
											step="0.5"
											placeholder="Ej. 2"
											required
										/>
									</label>
									<label className="det-label">
										Hora objetivo
										<input
											className="det-input"
											name="hora_asignada"
											type="time"
											value={form.hora_asignada}
											onChange={handleChange}
										/>
									</label>
									<label className="det-label">
										Prioridad
										<select
											className="det-input"
											name="prioridad"
											value={form.prioridad}
											onChange={handleChange}
										>
											<option value="NORMAL">Normal</option>
											<option value="ALTA">Alta</option>
											<option value="CRITICA">Crítica</option>
										</select>
									</label>
								</div>
								{formError && <p className="det-form-error" role="alert">{formError}</p>}
								<button
									className="continue-button det-btn-guardar"
									title="Guardar y agregar esta subtarea al evento"
									type="submit"
									disabled={guardando}
								>
									{guardando ? 'Guardando…' : 'Agregar tarea →'}
								</button>
							</form>
						)}

						{/* ── Lista de tareas ── */}
						<section className="det-tareas-section">
							<h2 className="det-tareas-titulo">
								Tareas
								{tareas.length > 0 && <span className="prog-badge badge-proxima">{tareas.length}</span>}
							</h2>

							{tareas.length === 0 && (
								<div className="det-sin-tareas">
									<p>Este evento aún no tiene tareas.</p>
									<button
										className="prog-action prog-action-primary"
										title="Abrir el formulario para crear la primera subtarea"
										onClick={() => setAbrirForm(true)}
									>
										+ Agregar la primera tarea
									</button>
								</div>
							)}

							<div className="det-tareas-lista">
								{tareas.map(t => (
									<TareaFila
										key={t.id}
										tarea={t}
										onEstado={handleEstado}
										onEliminar={handleEliminar}
										onEditar={handleEditarTarea}
									/>
								))}
							</div>
						</section>
					</>
				)}
			</div>
		</main>
	);
}