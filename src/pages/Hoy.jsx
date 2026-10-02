import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './Hoy.css';

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

	function continuar() {
		if (tipoSeleccionado) {
			navigate(`/crear?tipo=${tipoSeleccionado}`);
		}
	}

	return (
		<main className="event-home">
			<Header currentPage="hoy" />


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
					<p className="selection-count">{tipoSeleccionado ? '1 ocasión seleccionada' : 'Selecciona una ocasión'}</p>
				</div>

				<div className="occasion-grid">
					{tiposEvento.map((tipo) => (
						<button
							className={`occasion-option ${tipo.color}${tipoSeleccionado === tipo.id ? ' is-selected' : ''}`}
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
					<button className="continue-button" type="button" onClick={continuar} disabled={!tipoSeleccionado}>
						Continuar <span aria-hidden="true">→</span>
					</button>
				</div>
			</section>
			<footer className="event-footer"><span>EventPro</span><span>Los buenos momentos empiezan con un plan.</span></footer>
		</main>
	);
}