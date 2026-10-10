import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Hoy.css';

const API = 'http://127.0.0.1:8000';

const tiposEvento = [
	{ id: 'cumpleanos', nombre: 'Cumpleaños', descripcion: 'Un día para celebrar a lo grande.', icono: '🎂', color: 'coral' },
	{ id: 'fiesta', nombre: 'Fiesta', descripcion: 'Una buena razón para reunirnos.', icono: '🎉', color: 'amarillo' },
	{ id: 'compromiso', nombre: 'Compromiso', descripcion: 'El comienzo de una gran historia.', icono: '💍', color: 'rosa' },
	{ id: 'boda', nombre: 'Boda', descripcion: 'Cada detalle de un día inolvidable.', icono: '💐', color: 'verde' },
	{ id: 'baby-shower', nombre: 'Baby shower', descripcion: 'Bienvenida para alguien especial.', icono: '🍼', color: 'azul' },
	{ id: 'graduacion', nombre: 'Graduación', descripcion: 'Celebra todo lo que has logrado.', icono: '🎓', color: 'naranja' },
	{ id: 'corporativo', nombre: 'Evento corporativo', descripcion: 'Encuentros que impulsan nuevas ideas.', icono: '✨', color: 'lima' },
	{ id: 'otro', nombre: 'Otra ocasión', descripcion: 'Tu evento, a tu manera.', icono: '✳', color: 'lavanda' },
];

export default function Hoy() {
	const navigate = useNavigate();
	const [tipoSeleccionado, setTipoSeleccionado] = useState('');
	const [tooltipAbierto, setTooltipAbierto] = useState(false);
	const [eventosRecientes, setEventosRecientes] = useState([]);
	const [errorEventos, setErrorEventos] = useState('');
	const tooltipRef = useRef(null);

	useEffect(() => {
		let activo = true;
		fetch(`${API}/api/eventos/`, { credentials: 'include' })
			.then(response => {
				if (!response.ok) throw new Error('No se pudieron cargar tus eventos.');
				return response.json();
			})
			.then(data => {
				if (activo) {
					setEventosRecientes([...data].sort((a, b) => {
						const fechaA = new Date(a.fecha_creacion || 0).getTime();
						const fechaB = new Date(b.fecha_creacion || 0).getTime();
						return fechaB - fechaA || b.id - a.id;
					}).slice(0, 5));
				}
			})
			.catch(error => {
				if (activo) setErrorEventos(error.message);
			});
		return () => { activo = false; };
	}, []);

	useEffect(() => {
		if (!tooltipAbierto) return;
		function handleClick(e) {
			if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
				setTooltipAbierto(false);
			}
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [tooltipAbierto]);

	function continuar() {
		if (tipoSeleccionado) {
			navigate(`/crear?tipo=${tipoSeleccionado}`);
		}
	}

	return (
		<main className="event-home">
			<header className="event-topbar">
				<Link className="event-brand" to="/crear-evento" aria-label="EventPro, inicio">
					<span className="event-brand-mark" aria-hidden="true">E</span>
					<span>EventPro</span>
				</Link>
				<nav className="event-nav" aria-label="Navegación principal">
					<span className="event-nav-current" aria-current="page">Crear evento</span>
					<Link to="/progreso">Mis eventos</Link>
					<Link to="/hoy">Hoy</Link>
				</nav>
				<span className="event-user-mark" aria-label="Tu perfil">EP</span>
			</header>

			<section className="event-intro" aria-labelledby="event-title">
				<div className="event-intro-copy">
					<p className="event-kicker"><span /> UN MOTIVO PARA REUNIRNOS</p>
					<h1 id="event-title">¿Qué vamos<br />a celebrar?</h1>
					<p className="event-intro-text">Elige la ocasión. Nosotros ponemos en orden las ideas.</p>
				</div>
				<div className="event-intro-art" aria-hidden="true">
					<span className="art-sun">✳</span>
					<span className="art-ribbon">AQUÍ EMPIEZA<br />ALGO BUENO</span>
					<span className="art-orbit" />
				</div>
			</section>

			<section className="event-chooser" aria-labelledby="occasion-title">
				<div className="chooser-heading">
					<div>
						<p className="section-kicker">PRIMER PASO</p>
						<h2 id="occasion-title">Elige el tipo de evento</h2>
					</div>
					<div className="chooser-heading-right">
						<p className="selection-count">{tipoSeleccionado ? '1 ocasión seleccionada' : 'Selecciona una ocasión'}</p>
						<div className="orden-tooltip-wrap" ref={tooltipRef}>
							<button
								className="orden-btn"
								title="Explica cómo se ordenan las ocasiones"
								type="button"
								aria-expanded={tooltipAbierto}
								onClick={() => setTooltipAbierto((v) => !v)}
							>
								<span className="orden-btn-icon" aria-hidden="true">?</span>
								¿Cómo se ordena?
							</button>
							{tooltipAbierto && (
								<div className="orden-popover" role="tooltip">
									<strong className="orden-popover-title">Regla de prioridad</strong>
									<p>
										Los tipos de evento se agrupan por popularidad y ocasión. Dentro de cada grupo
										se ordenan por frecuencia de uso. En caso de empate, se muestra primero
										el de menor complejidad estimada.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="occasion-grid">
					{tiposEvento.map((tipo) => (
						<button
							className={`occasion-option ${tipo.color}${tipoSeleccionado === tipo.id ? ' is-selected' : ''}`}
							title={`Seleccionar ${tipo.nombre}`}
							key={tipo.id}
							type="button"
							aria-pressed={tipoSeleccionado === tipo.id}
							onClick={() => setTipoSeleccionado(tipo.id)}
						>
							<span className="occasion-icon" aria-hidden="true">{tipo.icono}</span>
							<span className="occasion-copy">
								<strong>{tipo.nombre}</strong>
								<span>{tipo.descripcion}</span>
							</span>
							<span className="occasion-check" aria-hidden="true">✓</span>
						</button>
					))}
				</div>

				<div className="chooser-footer">
					<p>Siempre hay algo que vale la pena celebrar.</p>
					<button className="continue-button" type="button" onClick={continuar} disabled={!tipoSeleccionado} title="Continuar para indicar el nombre y los datos del evento">
						Continuar <span aria-hidden="true">→</span>
					</button>
				</div>
			</section>

			<section className="recent-events" aria-labelledby="recent-events-title">
				<div className="recent-events-heading">
					<div>
						<p className="section-kicker">CONTINUAR ORGANIZANDO</p>
						<h2 id="recent-events-title">Eventos recientes</h2>
					</div>
					<Link className="recent-events-all" to="/progreso" title="Abrir la lista completa de eventos">Ver todos</Link>
				</div>
				{errorEventos && <p className="recent-events-empty" role="status">{errorEventos}</p>}
				{!errorEventos && eventosRecientes.length === 0 && (
					<p className="recent-events-empty">Todavía no has creado eventos.</p>
				)}
				{eventosRecientes.length > 0 && (
					<div className="recent-events-list">
						{eventosRecientes.map(evento => (
							<article className="recent-event-row" key={evento.id}>
								<div className="recent-event-info">
									<Link to={`/evento/${evento.id}`} title={`Abrir el detalle de ${evento.nombre}`}>{evento.nombre}</Link>
									<span>
										{evento.fecha_evento || 'Fecha pendiente'}
										{evento.hora_evento && ` · ${evento.hora_evento.slice(0, 5)}`}
										{` · ${(evento.tareas || []).length} subtareas`}
									</span>
								</div>
								<Link className="recent-event-action" to={`/evento/${evento.id}`} title={`Abrir ${evento.nombre} para agregar una subtarea`}>Crear subtarea <span aria-hidden="true">→</span></Link>
							</article>
						))}
					</div>
				)}
			</section>
			<footer className="event-footer"><span>EventPro</span><span>Los buenos momentos empiezan con un plan.</span></footer>
		</main>
	);
}