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

function TareaFila({ tarea, onEstado, onEliminar }) {
	const { label, cls } = ESTADO_LABEL[tarea.estado] || ESTADO_LABEL.PENDIENTE;
	return (
		<div className="det-tarea">
			<div className="det-tarea-info">
				<span className="det-tarea-titulo">{tarea.titulo}</span>
				<span className="det-tarea-meta">
					📅 {tarea.fecha_asignada} · ⏱ {tarea.horas_estimadas}h · {tarea.prioridad}
				</span>
			</div>
			<span className={`prog-badge ${cls}`}>{label}</span>
			<div className="det-tarea-actions">
				{tarea.estado !== 'HECHO' && (
					<button className="prog-action prog-action-primary" onClick={() => onEstado(tarea.id, 'HECHO')}>
						✓ Hecho
					</button>
				)}
				{tarea.estado === 'PENDIENTE' && (
					<button className="prog-action" onClick={() => onEstado(tarea.id, 'EN_PROGRESO')}>
						↻ En progreso
					</button>
				)}
				<button className="prog-action det-btn-eliminar" onClick={() => onEliminar(tarea.id)}>
					✕
				</button>
			</div>
		</div>
	);
}

const FORM_INICIAL = { titulo: '', fecha_asignada: '', horas_estimadas: '', prioridad: 'NORMAL' };

export default function DetalleEvento() {
	const { id } = useParams();
	const [evento, setEvento] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');
	const [form, setForm] = useState(FORM_INICIAL);
	const [formError, setFormError] = useState('');
	const [guardando, setGuardando] = useState(false);
	const [abrirForm, setAbrirForm] = useState(false);

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
				<Link className="event-brand" to="/hoy" aria-label="EventPro, inicio">
					<span className="event-brand-mark" aria-hidden="true">E</span>
					<span>EventPro</span>
				</Link>
				<nav className="event-nav" aria-label="Navegación principal">
					<Link to="/hoy">Crear evento</Link>
					<Link to="/progreso">Mis eventos</Link>
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
								<p className="det-meta">
									{tareas.length} tarea{tareas.length !== 1 ? 's' : ''}
									{tareas.length > 0 && ` · ${pct}% completado`}
									{` · Límite ${evento.limite_horas_diarias}h/día`}
								</p>
							</div>
							<button
								className="prog-action prog-action-primary det-btn-nueva"
								onClick={() => setAbrirForm(v => !v)}
							>
								{abrirForm ? '✕ Cancelar' : '+ Nueva tarea'}
							</button>
						</div>

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