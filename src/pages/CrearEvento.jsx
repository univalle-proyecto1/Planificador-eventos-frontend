import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Hoy.css';
import LogoutButton from '../LogoutButton';

const tiposEvento = {
	cumpleanos: 'Cumpleaños',
	fiesta: 'Fiesta',
	compromiso: 'Compromiso',
	boda: 'Boda',
	'baby-shower': 'Baby shower',
	graduacion: 'Graduación',
	corporativo: 'Evento corporativo',
	otro: 'Otra ocasión',
};

function fechaLocalActual() {
	const hoy = new Date();
	return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

export default function CrearEvento() {
	const [searchParams] = useSearchParams();
	const tipo = tiposEvento[searchParams.get('tipo')] || 'Evento';
	const [nombre, setNombre] = useState(tipo === 'Otra ocasión' ? '' : tipo);
	const [fechaEvento, setFechaEvento] = useState('');
	const [horaEvento, setHoraEvento] = useState('');
	const [horas, setHoras] = useState('6');
	const [error, setError] = useState('');
	const [guardando, setGuardando] = useState(false);
	const [eventoCreado, setEventoCreado] = useState('');
	const [eventoCreadoId, setEventoCreadoId] = useState(null);

	async function handleSubmit(event) {
		event.preventDefault();
		setError('');
		setGuardando(true);

		try {
			const csrfResponse = await fetch('http://127.0.0.1:8000/api/auth/csrf/', { credentials: 'include' });
			const csrfResult = await csrfResponse.json();
			if (!csrfResponse.ok || !csrfResult.csrfToken) {
				throw new Error('No se pudo validar la solicitud. Actualiza la página e inténtalo de nuevo.');
			}

			const response = await fetch('http://127.0.0.1:8000/api/eventos/', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfResult.csrfToken,
				},
				body: JSON.stringify({
					nombre: nombre.trim(),
					fecha_evento: fechaEvento || null,
					hora_evento: horaEvento || null,
					limite_horas_diarias: Number(horas),
				}),
			});
			const result = await response.json().catch(() => ({}));

			if (!response.ok) {
				const fieldError = Object.values(result).flat().find(value => typeof value === 'string');
				throw new Error(fieldError || result.detail || 'No se pudo guardar el evento. Inténtalo de nuevo.');
			}

			setEventoCreado(result.nombre || nombre.trim());
			setEventoCreadoId(result.id);
		} catch (submitError) {
			setError(submitError instanceof TypeError
				? 'No se pudo conectar con el servidor. Comprueba que el backend esté iniciado.'
				: submitError.message);
		} finally {
			setGuardando(false);
		}
	}

	return (
		<main className="create-event-page">
			<header className="event-topbar">
				<Link className="event-brand" to="/crear-evento" aria-label="EventPro, inicio">
					<span className="event-brand-mark" aria-hidden="true">E</span>
					<span>EventPro</span>
				</Link>
				<nav className="event-nav" aria-label="Navegación principal">
					<span className="event-nav-current" aria-current="page">Crear evento</span>
					<Link to="/hoy">Hoy</Link>
					<Link to="/progreso">Mis eventos</Link>
				</nav>
				<div className="event-user-actions">
					<LogoutButton />
					<span className="event-user-mark" aria-label="Tu perfil">EP</span>
				</div>
			</header>

			<section className="create-event-main">
				<Link className="create-back" to="/crear-evento">← Volver a las ocasiones</Link>
				{eventoCreado ? (
					<div className="create-success-panel" role="status" aria-live="polite">
						<span className="create-success-icon" aria-hidden="true">✓</span>
						<p className="section-kicker">EVENTO CREADO</p>
						<h1>{eventoCreado}</h1>
						<p>Ya está en tu lista. Puedes seguir añadiendo los detalles de la celebración.</p>
						<div className="create-success-actions">
							{eventoCreadoId && (
								<Link className="continue-button" to={`/evento/${eventoCreadoId}`} title="Abrir el evento y agregar subtareas">
									Crear subtareas <span aria-hidden="true">→</span>
								</Link>
							)}
							<Link className="continue-button create-success-secondary" to="/progreso" title="Ver todos tus eventos">
								Ver mis eventos <span aria-hidden="true">→</span>
							</Link>
						</div>
					</div>
				) : (
					<div className="create-form-panel">
						<p className="section-kicker">NUEVO EVENTO · {tipo.toUpperCase()}</p>
						<h1>Pongámosle nombre.</h1>
						<p>Empieza con lo esencial. Podrás organizar el resto después.</p>
						<form className="create-form" onSubmit={handleSubmit}>
							<label htmlFor="event-name">
								Nombre del evento
								<input
									autoFocus
									autoComplete="off"
									id="event-name"
									maxLength={200}
									name="nombre"
									onChange={(event) => setNombre(event.target.value)}
									placeholder={`Ej. ${tipo} de Laura`}
									required
									value={nombre}
								/>
							</label>
							<label htmlFor="event-date">
								Fecha del evento
								<input
									id="event-date"
									name="fecha_evento"
									min={fechaLocalActual()}
									onChange={(event) => setFechaEvento(event.target.value)}
									type="date"
									value={fechaEvento}
								/>
							</label>
							<label htmlFor="event-time">
								Hora del evento
								<input
									id="event-time"
									name="hora_evento"
									onChange={(event) => setHoraEvento(event.target.value)}
									type="time"
									value={horaEvento}
								/>
							</label>
							<label htmlFor="event-hours">
								Horas disponibles al día
								<input
									id="event-hours"
									max="24"
									min="1"
									name="horas"
									onChange={(event) => setHoras(event.target.value)}
									type="number"
									value={horas}
								/>
							</label>
							{error && <p className="create-error" role="alert">{error}</p>}
							<button className="continue-button" type="submit" disabled={guardando || !nombre.trim()} title="Guardar y crear el evento">
								{guardando ? 'Guardando…' : 'Crear evento'} <span aria-hidden="true">→</span>
							</button>
						</form>
					</div>
				)}
			</section>
		</main>
	);
}