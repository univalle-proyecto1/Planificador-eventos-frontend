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

function TareaFila({ tarea, onAccion }) {
	const tipo = clasificarTarea(tarea);
	const { label, cls } = BADGE[tipo];
	return (
		<div className="prog-tarea">
			<div className="prog-tarea-info">
				<span className="prog-tarea-titulo">{tarea.titulo}</span>
				<span className="prog-tarea-meta">{tarea.fecha_asignada} · {tarea.horas_estimadas}h</span>
			</div>
			<span className={`prog-badge ${cls}`}>{label}</span>
			{tipo !== 'hecho' && (
				<div className="prog-tarea-actions">
					<button className="prog-action prog-action-primary" onClick={() => onAccion(tarea.id, 'HECHO')}>✓</button>
					<button className="prog-action" onClick={() => onAccion(tarea.id, 'POSPUESTO')}>↷</button>
				</div>
			)}
		</div>
	);
}

function EventoCard({ evento, onAccion, onEliminar }) {
  const tareas = evento.tareas || [];
  const pendientes = tareas.filter(t => t.estado !== 'HECHO');
  const hechas = tareas.filter(t => t.estado === 'HECHO');
  const porcentaje = tareas.length > 0 ? Math.round((hechas.length / tareas.length) * 100) : 0;
  // Determinar estado general del evento
  const tieneVencidas = pendientes.some(t => clasificarTarea(t) === 'vencida');
  const tieneHoy = pendientes.some(t => clasificarTarea(t) === 'paraHoy');

  return (
    <article className="prog-evento-card">
      <div className="prog-evento-header">
        <div className="prog-evento-info">
          <Link to={`/evento/${evento.id}`} className="prog-evento-nombre">
            {evento.nombre} →
          </Link>
          <p className="prog-evento-meta">
            {tareas.length} tarea{tareas.length !== 1 ? 's' : ''}
            {tareas.length > 0 && ` · ${porcentaje}% completado`}
          </p>
        </div>
        <div className="prog-evento-actions">
          <button className="prog-action prog-action-delete" onClick={() => onEliminar(evento.id)} title="Eliminar evento">
            ✕
          </button>
        </div>
        <div className="prog-evento-badges">
          {tieneVencidas && <span className="prog-badge badge-vencida">VENCIDAS</span>}
          {tieneHoy && <span className="prog-badge badge-hoy">PARA HOY</span>}
          {!tieneVencidas && !tieneHoy && tareas.length > 0 && (
            <span className="prog-badge badge-proxima">AL DÍA</span>
          )}
          {tareas.length === 0 && (
            <span className="prog-badge badge-sin-tareas">SIN TAREAS</span>
          )}
        </div>
      </div>

      {tareas.length > 0 && (
        <>
          <div className="prog-barra-wrap">
            <div className="prog-barra">
              <div className="prog-barra-fill" style={{ width: `${porcentaje}%` }} />
            </div>
            <span className="prog-barra-pct">{porcentaje}%</span>
          </div>
          <div className="prog-tareas-lista">
            {pendientes.map(t => (
              <TareaFila key={t.id} tarea={t} onAccion={onAccion} />
            ))}
            {hechas.length > 0 && (
              <p className="prog-hechas-label">+ {hechas.length} completada{hechas.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </>
      )}

      {tareas.length === 0 && (
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
							<EventoCard key={ev.id} evento={ev} onAccion={handleAccion} onEliminar={handleEliminar} />
						))}
					</div>
				)}
			</div>
		</main>
	);
}