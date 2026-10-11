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

function TareaFila({ tarea, onEstado, onEliminar, onAbrirReprogramar }) {
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
					<button
						className="prog-action prog-action-primary"
						onClick={() => onEstado(tarea.id, 'HECHO')}
						title="Marcar como completada"
					>
						✓ Hecho
					</button>
				)}
				{tarea.estado === 'PENDIENTE' && (
					<button
						className="prog-action"
						onClick={() => onEstado(tarea.id, 'EN_PROGRESO')}
						title="Marcar en progreso"
					>
						↻ En progreso
					</button>
				)}
				{tarea.estado === 'EN_PROGRESO' && (
					<button
						className="prog-action"
						onClick={() => onEstado(tarea.id, 'PENDIENTE')}
						title="Pausar o regresar a pendiente"
					>
						⏳ Pausar
					</button>
				)}
				{tarea.estado === 'HECHO' && (
					<button
						className="prog-action"
						onClick={() => onEstado(tarea.id, 'PENDIENTE')}
						title="Reabrir tarea"
					>
						↺ Reabrir
					</button>
				)}
				<button
					className="prog-action prog-action-reprog-evento"
					onClick={() => onAbrirReprogramar(tarea)}
					title="Reprogramar fecha de esta tarea"
				>
					📅 Reprogramar
				</button>
				<button
					className="prog-action det-btn-eliminar"
					onClick={() => onEliminar(tarea.id)}
					title="Eliminar tarea"
				>
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

	// Estado para modal reprogramar tarea
	const [tareaAReprogramar, setTareaAReprogramar] = useState(null);
	const [reprogFecha, setReprogFecha] = useState('');
	const [reprogHoras, setReprogHoras] = useState('');
	const [reprogReactivar, setReprogReactivar] = useState(true);
	const [reprogError, setReprogError] = useState('');
	const [guardandoReprog, setGuardandoReprog] = useState(false);

	// Estado para modal reprogramar evento
	const [abrirReprogEvento, setAbrirReprogEvento] = useState(false);
	const [eventoFecha, setEventoFecha] = useState('');
	const [diasDesplazamiento, setDiasDesplazamiento] = useState('');
	const [eventoReprogError, setEventoReprogError] = useState('');
	const [guardandoEventoReprog, setGuardandoEventoReprog] = useState(false);

	const cargar = useCallback(async () => {
		setCargando(true);
		setError('');
		try {
			const res = await fetch(`${API}/api/eventos/${id}/`, { credentials: 'include' });
			if (!res.ok) throw new Error('No se encontró el evento.');
			const data = await res.json();
			setEvento(data);
			setEventoFecha(data.fecha_evento || '');
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

	function abrirModalReprogramarTarea(tarea) {
		setTareaAReprogramar(tarea);
		setReprogFecha(tarea.fecha_asignada);
		setReprogHoras(tarea.horas_estimadas);
		setReprogReactivar(true);
		setReprogError('');
	}

	async function handleGuardarReprogramarTarea(e) {
		e.preventDefault();
		if (!tareaAReprogramar) return;
		if (!reprogFecha) return setReprogError('Selecciona una fecha válida.');

		setGuardandoReprog(true);
		setReprogError('');
		try {
			const csrfRes = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfRes.json();

			const bodyData = {
				fecha_asignada: reprogFecha,
				horas_estimadas: Number(reprogHoras),
			};
			if (tareaAReprogramar.estado === 'POSPUESTO' && reprogReactivar) {
				bodyData.estado = 'PENDIENTE';
			}

			// Intentar con endpoint reprogramar o PATCH directo
			let res = await fetch(`${API}/api/tareas/${tareaAReprogramar.id}/reprogramar/`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
				body: JSON.stringify(bodyData),
			});

			if (!res.ok) {
				// Fallback a PATCH si fuera necesario
				res = await fetch(`${API}/api/tareas/${tareaAReprogramar.id}/`, {
					method: 'PATCH',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
					body: JSON.stringify(bodyData),
				});
			}

			const result = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = Array.isArray(result?.non_field_errors)
					? result.non_field_errors[0]
					: result?.detail || JSON.stringify(result);
				throw new Error(msg);
			}

			setTareaAReprogramar(null);
			cargar();
		} catch (err) {
			setReprogError(err.message);
		} finally {
			setGuardandoReprog(false);
		}
	}

	async function handleGuardarReprogramarEvento(e) {
		e.preventDefault();
		setGuardandoEventoReprog(true);
		setEventoReprogError('');
		try {
			const csrfRes = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfRes.json();

			const payload = {};
			if (eventoFecha !== undefined) payload.fecha_evento = eventoFecha;
			if (diasDesplazamiento !== '' && !isNaN(Number(diasDesplazamiento))) {
				payload.dias_desplazamiento = Number(diasDesplazamiento);
			}

			const res = await fetch(`${API}/api/eventos/${id}/reprogramar/`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
				body: JSON.stringify(payload),
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = result?.detail || JSON.stringify(result);
				throw new Error(msg);
			}

			setAbrirReprogEvento(false);
			cargar();
		} catch (err) {
			setEventoReprogError(err.message);
		} finally {
			setGuardandoEventoReprog(false);
		}
	}

	// Cálculos de avance progresivo
	const tareas = evento?.tareas || [];
	const total = tareas.length;
	const hechas = tareas.filter(t => t.estado === 'HECHO');
	const enProgreso = tareas.filter(t => t.estado === 'EN_PROGRESO');
	const pendientes = tareas.filter(t => t.estado === 'PENDIENTE');
	const pospuestas = tareas.filter(t => t.estado === 'POSPUESTO');

	const pctHechas = total > 0 ? (hechas.length / total) * 100 : 0;
	const pctEnProgreso = total > 0 ? (enProgreso.length / total) * 100 : 0;
	// Avance progresivo ponderado: Hechas aportan 100%, En progreso aportan 50%
	const pctAvanceProgresivo = total > 0 ? Math.min(100, Math.round(((hechas.length + enProgreso.length * 0.5) / total) * 100)) : 0;

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
									{evento.fecha_evento && `📅 Fecha evento: ${evento.fecha_evento} · `}
									{tareas.length} tarea{tareas.length !== 1 ? 's' : ''}
									{tareas.length > 0 && ` · ${pctAvanceProgresivo}% de avance`}
									{` · Límite ${evento.limite_horas_diarias}h/día`}
								</p>
							</div>
							<div className="det-header-actions">
								<button
									className="prog-action prog-action-reprog-evento"
									onClick={() => setAbrirReprogEvento(true)}
									title="Reprogramar fecha del evento o desplazar tareas pendientes"
								>
									📅 Reprogramar evento
								</button>
								<button
									className="prog-action prog-action-primary det-btn-nueva"
									onClick={() => setAbrirForm(v => !v)}
								>
									{abrirForm ? '✕ Cancelar' : '+ Nueva tarea'}
								</button>
							</div>
						</div>

						{/* ── Barra de progreso progresiva ── */}
						{tareas.length > 0 && (
							<div className="prog-barra-container det-barra">
								<div className="prog-barra-wrap">
									<div
										className="prog-barra"
										title={`Completadas: ${hechas.length}, En progreso: ${enProgreso.length}, Pendientes: ${pendientes.length}`}
									>
										<div
											className="prog-barra-fill prog-barra-hecho"
											style={{ width: `${pctHechas}%` }}
										/>
										<div
											className="prog-barra-fill prog-barra-progreso"
											style={{ width: `${pctEnProgreso}%` }}
										/>
									</div>
									<span className="prog-barra-pct">{pctAvanceProgresivo}% avance</span>
								</div>
								<div className="prog-pills-row">
									<span className="prog-pill pill-hecho">
										✓ {hechas.length} completada{hechas.length !== 1 ? 's' : ''} ({Math.round(pctHechas)}%)
									</span>
									{enProgreso.length > 0 && (
										<span className="prog-pill pill-progreso">
											↻ {enProgreso.length} en curso ({Math.round(pctEnProgreso)}%)
										</span>
									)}
									<span className="prog-pill pill-pendiente">
										⏳ {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
									</span>
									{pospuestas.length > 0 && (
										<span className="prog-pill pill-pospuesto">
											↷ {pospuestas.length} pospuesta{pospuestas.length !== 1 ? 's' : ''}
										</span>
									)}
								</div>
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
										onAbrirReprogramar={abrirModalReprogramarTarea}
									/>
								))}
							</div>
						</section>
					</>
				)}

				{/* ── Modal Reprogramar Tarea ── */}
				{tareaAReprogramar && (
					<div className="modal-overlay" onClick={() => setTareaAReprogramar(null)}>
						<div className="modal-card" onClick={e => e.stopPropagation()}>
							<div className="modal-head">
								<div>
									<p className="section-kicker">REPROGRAMAR TAREA</p>
									<h3 className="modal-title">{tareaAReprogramar.titulo}</h3>
								</div>
								<button className="modal-close" onClick={() => setTareaAReprogramar(null)}>✕</button>
							</div>
							<form onSubmit={handleGuardarReprogramarTarea} className="modal-body">
								<p className="modal-meta">
									Fecha actual: <strong>{tareaAReprogramar.fecha_asignada}</strong> · {tareaAReprogramar.horas_estimadas}h
								</p>
								<label className="det-label">
									Nueva fecha asignada
									<input
										type="date"
										className="det-input"
										value={reprogFecha}
										onChange={e => { setReprogFecha(e.target.value); setReprogError(''); }}
										required
									/>
								</label>
								<label className="det-label">
									Horas estimadas
									<input
										type="number"
										className="det-input"
										value={reprogHoras}
										onChange={e => { setReprogHoras(e.target.value); setReprogError(''); }}
										min="0.5"
										max="24"
										step="0.5"
										required
									/>
								</label>
								{tareaAReprogramar.estado === 'POSPUESTO' && (
									<label className="det-label modal-checkbox-label">
										<input
											type="checkbox"
											checked={reprogReactivar}
											onChange={e => setReprogReactivar(e.target.checked)}
										/>
										Reactivar como tarea PENDIENTE
									</label>
								)}
								{reprogError && <p className="det-form-error" role="alert">{reprogError}</p>}
								<div className="modal-actions">
									<button type="button" className="prog-action" onClick={() => setTareaAReprogramar(null)}>
										Cancelar
									</button>
									<button type="submit" className="continue-button modal-btn-guardar" disabled={guardandoReprog}>
										{guardandoReprog ? 'Guardando…' : 'Guardar nueva fecha →'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* ── Modal Reprogramar Evento ── */}
				{abrirReprogEvento && (
					<div className="modal-overlay" onClick={() => setAbrirReprogEvento(false)}>
						<div className="modal-card" onClick={e => e.stopPropagation()}>
							<div className="modal-head">
								<div>
									<p className="section-kicker">REPROGRAMAR EVENTO</p>
									<h3 className="modal-title">{evento.nombre}</h3>
								</div>
								<button className="modal-close" onClick={() => setAbrirReprogEvento(false)}>✕</button>
							</div>
							<form onSubmit={handleGuardarReprogramarEvento} className="modal-body">
								<p className="modal-meta">
									Tareas pendientes: <strong>{pendientes.length}</strong> de {tareas.length}
								</p>
								<label className="det-label">
									Fecha del evento (opcional)
									<input
										type="date"
										className="det-input"
										value={eventoFecha}
										onChange={e => { setEventoFecha(e.target.value); setEventoReprogError(''); }}
									/>
								</label>
								{pendientes.length > 0 && (
									<div className="modal-shift-section">
										<p className="modal-subheading">Mover tareas pendientes en bloque:</p>
										<div className="quick-shift-buttons">
											<button type="button" className="prog-action" onClick={() => setDiasDesplazamiento('1')}>+1 día</button>
											<button type="button" className="prog-action" onClick={() => setDiasDesplazamiento('3')}>+3 días</button>
											<button type="button" className="prog-action" onClick={() => setDiasDesplazamiento('7')}>+1 sem (7d)</button>
											<button type="button" className="prog-action" onClick={() => setDiasDesplazamiento('14')}>+2 sem (14d)</button>
										</div>
										<label className="det-label" style={{ marginTop: '8px' }}>
											Días a desplazar (+/- días)
											<input
												type="number"
												className="det-input"
												value={diasDesplazamiento}
												onChange={e => { setDiasDesplazamiento(e.target.value); setEventoReprogError(''); }}
												placeholder="Ej. 7"
											/>
										</label>
									</div>
								)}
								{eventoReprogError && <p className="det-form-error" role="alert">{eventoReprogError}</p>}
								<div className="modal-actions">
									<button type="button" className="prog-action" onClick={() => setAbrirReprogEvento(false)}>
										Cancelar
									</button>
									<button type="submit" className="continue-button modal-btn-guardar" disabled={guardandoEventoReprog}>
										{guardandoEventoReprog ? 'Reprogramando…' : 'Aplicar reprogramación →'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}