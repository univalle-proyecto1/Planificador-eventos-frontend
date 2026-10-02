import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { parseApiError } from '../utils/api';
import './Hoy.css';

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

export default function CrearEvento() {
	const [searchParams] = useSearchParams();
	const tipo = tiposEvento[searchParams.get('tipo')] || 'Evento';
	const [nombre, setNombre] = useState(tipo === 'Otra ocasión' ? '' : tipo);
	const [horas, setHoras] = useState('6');
	const [error, setError] = useState('');
	const [guardando, setGuardando] = useState(false);
	const [eventoCreado, setEventoCreado] = useState('');

	async function handleSubmit(event) {
		event.preventDefault();
		setError('');
		setGuardando(true);

		try {
			const csrfResponse = await fetch('/api/auth/csrf/');
			const csrfResult = await csrfResponse.json();
			if (!csrfResponse.ok || !csrfResult.csrfToken) {
				throw new Error('No se pudo validar la solicitud. Actualiza la página e inténtalo de nuevo.');
			}

			const response = await fetch('/api/eventos/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfResult.csrfToken,
				},
				body: JSON.stringify({ nombre: nombre.trim(), limite_horas_diarias: Number(horas) }),
			});
			const result = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(parseApiError(result, 'No se pudo guardar el evento. Inténtalo de nuevo.'));
			}

			setEventoCreado(result.nombre || nombre.trim());
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
			<Header currentPage="crear" />


			<section className="create-event-main">
				<Link className="create-back" to="/hoy">← Volver a las ocasiones</Link>
				{eventoCreado ? (
					<div className="create-success-panel" role="status" aria-live="polite">
						<span className="create-success-icon" aria-hidden="true">✓</span>
						<p className="section-kicker">EVENTO CREADO</p>
						<h1>{eventoCreado}</h1>
						<p>Ya está en tu lista. Puedes seguir añadiendo los detalles de la celebración.</p>
						<Link className="continue-button" to="/progreso">Ver mis eventos <span aria-hidden="true">→</span></Link>
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
							<button className="continue-button" type="submit" disabled={guardando || !nombre.trim()}>
								{guardando ? 'Guardando…' : 'Crear evento'} <span aria-hidden="true">→</span>
							</button>
						</form>
					</div>
				)}
			</section>
		</main>
	);
}