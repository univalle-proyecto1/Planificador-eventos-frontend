import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Progreso.css';

const API = 'http://127.0.0.1:8000';

function clasificarTarea(tarea) {
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	const fecha = new Date(tarea.fecha_asignada + 'T00:00:00');
	if (tarea.estado === 'HECHO') return 'hecho';
	if (fecha < hoy) return 'vencida';
	if (fecha.getTime() === hoy.getTime()) return 'paraHoy';
	return 'proxima';
}

const BADGE = {
	vencida:  { label: 'VENCIDA',   cls: 'badge-vencida' },
	paraHoy:  { label: 'PARA HOY',  cls: 'badge-hoy' },
	proxima:  { label: 'PENDIENTE', cls: 'badge-proxima' },
	hecho:    { label: 'HECHO',     cls: 'badge-hecho' },
};

function TareaFila({ tarea, onAccion, onAbrirReprogTarea }) {
	const tipo = clasificarTarea(tarea);
	const { label, cls } = BADGE[tipo];
	return (
		<div className="prog-tarea">
			<div className="prog-tarea-info">
				<span className="prog-tarea-titulo">{tarea.titulo}</span>
				<span className="prog-tarea-meta">
					📅 {tarea.fecha_asignada} · ⏱ {tarea.horas_estimadas}h
				</span>
			</div>
			<span className={`prog-badge ${cls}`}>{label}</span>
			{tipo !== 'hecho' && (
				<div className="prog-tarea-actions">
					<button
						className="prog-action prog-action-primary"
						onClick={() => onAccion(tarea.id, 'HECHO')}
						title="Marcar como completada"
					>
						✓
					</button>
					{tarea.estado === 'PENDIENTE' && (
						<button
							className="prog-action"
							onClick={() => onAccion(tarea.id, 'EN_PROGRESO')}
							title="Marcar en progreso"
						>
							↻
						</button>
					)}
					{tarea.estado === 'EN_PROGRESO' && (
						<button
							className="prog-action"
							onClick={() => onAccion(tarea.id, 'PENDIENTE')}
							title="Regresar a pendiente"
						>
							⏳
						</button>
					)}
					<button
						className="prog-action prog-action-reprog-btn"
						onClick={() => onAbrirReprogTarea(tarea)}
						title="Reprogramar fecha de la tarea"
					>
						📅 Reprogramar
					</button>
					{tarea.estado !== 'POSPUESTO' && (
						<button
							className="prog-action"
							onClick={() => onAccion(tarea.id, 'POSPUESTO')}
							title="Posponer tarea"
						>
							↷
						</button>
					)}
				</div>
			)}
		</div>
	);
}

function EventoCard({ evento, onAccion, onEliminar, onAbrirReprogEvento, onAbrirReprogTarea }) {
  const tareas = evento.tareas || [];
  const total = tareas.length;
  const hechas = tareas.filter(t => t.estado === 'HECHO');
  const enProgreso = tareas.filter(t => t.estado === 'EN_PROGRESO');
  const pendientes = tareas.filter(t => t.estado === 'PENDIENTE');
  const pospuestas = tareas.filter(t => t.estado === 'POSPUESTO');
  const tareasNoHechas = tareas.filter(t => t.estado !== 'HECHO');

  const pctHechas = total > 0 ? (hechas.length / total) * 100 : 0;
  const pctEnProgreso = total > 0 ? (enProgreso.length / total) * 100 : 0;
  // Avance progresivo: Hechas al 100%, En progreso al 50%
  const porcentaje = total > 0 ? Math.min(100, Math.round(((hechas.length + enProgreso.length * 0.5) / total) * 100)) : 0;

  // Determinar estado general del evento
  const tieneVencidas = tareasNoHechas.some(t => clasificarTarea(t) === 'vencida');
  const tieneHoy = tareasNoHechas.some(t => clasificarTarea(t) === 'paraHoy');

  return (
    <article className="prog-evento-card">
      <div className="prog-evento-header">
        <div className="prog-evento-info">
          <Link to={`/evento/${evento.id}`} className="prog-evento-nombre">
            {evento.nombre} →
          </Link>
          <p className="prog-evento-meta">
            {evento.fecha_evento && `📅 Fecha: ${evento.fecha_evento} · `}
            {total} tarea{total !== 1 ? 's' : ''}
            {total > 0 && ` · ${porcentaje}% de avance`}
          </p>
        </div>
        <div className="prog-evento-actions">
          <button
            className="prog-action prog-action-reprog-evento"
            onClick={() => onAbrirReprogEvento(evento)}
            title="Reprogramar fecha del evento o tareas"
          >
            📅 Reprogramar
          </button>
          <button
            className="prog-action prog-action-delete"
            onClick={() => onEliminar(evento.id)}
            title="Eliminar evento"
          >
            ✕
          </button>
        </div>
        <div className="prog-evento-badges">
          {tieneVencidas && <span className="prog-badge badge-vencida">VENCIDAS</span>}
          {tieneHoy && <span className="prog-badge badge-hoy">PARA HOY</span>}
          {!tieneVencidas && !tieneHoy && total > 0 && (
            <span className="prog-badge badge-proxima">AL DÍA</span>
          )}
          {total === 0 && (
            <span className="prog-badge badge-sin-tareas">SIN TAREAS</span>
          )}
        </div>
      </div>

      {total > 0 && (
        <>
          <div className="prog-barra-wrap">
            <div
              className="prog-barra"
              title={`Completadas: ${hechas.length}, En progreso: ${enProgreso.length}, Pendientes: ${pendientes.length}`}
            >
              <div className="prog-barra-fill prog-barra-hecho" style={{ width: `${pctHechas}%` }} />
              <div className="prog-barra-fill prog-barra-progreso" style={{ width: `${pctEnProgreso}%` }} />
            </div>
            <span className="prog-barra-pct">{porcentaje}% avance</span>
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

          <div className="prog-tareas-lista">
            {tareasNoHechas.map(t => (
              <TareaFila
                key={t.id}
                tarea={t}
                onAccion={onAccion}
                onAbrirReprogTarea={onAbrirReprogTarea}
              />
            ))}
            {hechas.length > 0 && (
              <p className="prog-hechas-label">
                + {hechas.length} completada{hechas.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </>
      )}

      {total === 0 && (
        <p className="prog-sin-tareas-msg">
          Este evento aún no tiene tareas asignadas.
        </p>
      )}
    </article>
  );
}

export default function Progreso() {
	const [eventos, setEventos] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');

	// Modal Reprogramar Tarea
	const [tareaAReprogramar, setTareaAReprogramar] = useState(null);
	const [reprogFecha, setReprogFecha] = useState('');
	const [reprogHoras, setReprogHoras] = useState('');
	const [reprogReactivar, setReprogReactivar] = useState(true);
	const [reprogError, setReprogError] = useState('');
	const [guardandoReprog, setGuardandoReprog] = useState(false);

	// Modal Reprogramar Evento
	const [eventoAReprogramar, setEventoAReprogramar] = useState(null);
	const [eventoFecha, setEventoFecha] = useState('');
	const [diasDesplazamiento, setDiasDesplazamiento] = useState('');
	const [eventoReprogError, setEventoReprogError] = useState('');
	const [guardandoEventoReprog, setGuardandoEventoReprog] = useState(false);

	const cargar = useCallback(async () => {
		setCargando(true);
		setError('');
		try {
			const res = await fetch(`${API}/api/eventos/`, { credentials: 'include' });
			if (!res.ok) throw new Error('No se pudo cargar los eventos.');
			const data = await res.json();
			setEventos(data);
		} catch (e) {
			setError(e.message);
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => { cargar(); }, [cargar]);

	async function handleAccion(tareaId, nuevoEstado) {
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
		} catch {
			setError('No se pudo actualizar la tarea.');
		}
	}

	async function handleEliminar(eventoId) {
		if (!window.confirm('¿Seguro que quieres eliminar este evento y todas sus tareas?')) return;
		try {
			const csrfRes = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfRes.json();
			const res = await fetch(`${API}/api/eventos/${eventoId}/`, {
				method: 'DELETE',
				credentials: 'include',
				headers: { 'X-CSRFToken': csrfToken },
			});
			if (!res.ok) throw new Error('Error al eliminar');
			cargar();
		} catch {
			setError('No se pudo eliminar el evento.');
		}
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

			let res = await fetch(`${API}/api/tareas/${tareaAReprogramar.id}/reprogramar/`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
				body: JSON.stringify(bodyData),
			});

			if (!res.ok) {
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

	function abrirModalReprogramarEvento(ev) {
		setEventoAReprogramar(ev);
		setEventoFecha(ev.fecha_evento || '');
		setDiasDesplazamiento('');
		setEventoReprogError('');
	}

	async function handleGuardarReprogramarEvento(e) {
		e.preventDefault();
		if (!eventoAReprogramar) return;

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

			const res = await fetch(`${API}/api/eventos/${eventoAReprogramar.id}/reprogramar/`, {
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

			setEventoAReprogramar(null);
			cargar();
		} catch (err) {
			setEventoReprogError(err.message);
		} finally {
			setGuardandoEventoReprog(false);
		}
	}

	return (
		<main className="prog-page">
			<header className="event-topbar">
				<Link className="event-brand" to="/hoy" aria-label="EventPro, inicio">
					<span className="event-brand-mark" aria-hidden="true">E</span>
					<span>EventPro</span>
				</Link>
				<nav className="event-nav" aria-label="Navegación principal">
					<Link to="/hoy">Crear evento</Link>
					<span className="event-nav-current">Mis eventos</span>
					<Link to="/hoy-eventos">HOY</Link>
				</nav>
				<span className="event-user-mark" aria-label="Tu perfil">EP</span>
			</header>

			<div className="prog-container">
				<div className="prog-head">
					<div>
						<p className="prog-kicker">MIS EVENTOS</p>
						<h1 className="prog-titulo">Progreso</h1>
						<p className="prog-subtitulo">Todos tus eventos y su estado actual.</p>
					</div>
					<button className="prog-refresh" onClick={cargar} title="Actualizar">↻</button>
				</div>

				{cargando && (
					<div className="prog-estado">
						<span className="prog-spinner" />
						<p>Cargando eventos…</p>
					</div>
				)}

				{error && (
					<div className="prog-estado prog-estado-error">
						<p>{error}</p>
						<button className="prog-action prog-action-primary" onClick={cargar}>Reintentar</button>
					</div>
				)}

				{!cargando && !error && eventos.length === 0 && (
					<div className="prog-estado">
						<span className="prog-vacio-icon">✦</span>
						<p>Aún no tienes eventos creados.</p>
						<Link className="prog-action prog-action-primary" to="/hoy">Crear mi primer evento</Link>
					</div>
				)}

				{!cargando && !error && eventos.length > 0 && (
					<div className="prog-eventos-lista">
						{[...eventos].sort((a, b) => {
							const hoy = new Date();
							const todayStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
							const aHasToday = (a.tareas || []).some(t => t.fecha_asignada === todayStr);
							const bHasToday = (b.tareas || []).some(t => t.fecha_asignada === todayStr);
							if (aHasToday && !bHasToday) return -1;
							if (!aHasToday && bHasToday) return 1;
							return 0;
						}).map(ev => (
							<EventoCard
								key={ev.id}
								evento={ev}
								onAccion={handleAccion}
								onEliminar={handleEliminar}
								onAbrirReprogEvento={abrirModalReprogramarEvento}
								onAbrirReprogTarea={abrirModalReprogramarTarea}
							/>
						))}
					</div>
				)}
			</div>

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
			{eventoAReprogramar && (
				<div className="modal-overlay" onClick={() => setEventoAReprogramar(null)}>
					<div className="modal-card" onClick={e => e.stopPropagation()}>
						<div className="modal-head">
							<div>
								<p className="section-kicker">REPROGRAMAR EVENTO</p>
								<h3 className="modal-title">{eventoAReprogramar.nombre}</h3>
							</div>
							<button className="modal-close" onClick={() => setEventoAReprogramar(null)}>✕</button>
						</div>
						<form onSubmit={handleGuardarReprogramarEvento} className="modal-body">
							<p className="modal-meta">
								Tareas pendientes: <strong>{(eventoAReprogramar.tareas || []).filter(t => t.estado !== 'HECHO').length}</strong> de {(eventoAReprogramar.tareas || []).length}
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
							{(eventoAReprogramar.tareas || []).filter(t => t.estado !== 'HECHO').length > 0 && (
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
								<button type="button" className="prog-action" onClick={() => setEventoAReprogramar(null)}>
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
		</main>
	);
}