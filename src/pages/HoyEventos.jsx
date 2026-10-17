import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Hoy.css';
import './Progreso.css';
import LogoutButton from '../LogoutButton';

const API = 'http://127.0.0.1:8000';

function describirNovedad(novedad) {
  switch (novedad.tipo) {
    case 'EVENTO_CREADO':
      return `Evento creado: ${novedad.evento_nombre}`;
    case 'EVENTO_EDITADO':
      return `Evento editado: ${novedad.evento_nombre}`;
    case 'SUBTAREA_AGREGADA':
      return `Subtarea agregada: ${novedad.subtarea_titulo} · ${novedad.evento_nombre}`;
    case 'SUBTAREA_COMPLETADA':
      return `Subtarea completada: ${novedad.subtarea_titulo} · ${novedad.evento_nombre}`;
    default:
      return novedad.evento_nombre;
  }
}

export default function HoyEventos() {
  const [eventos, setEventos] = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorNovedades, setErrorNovedades] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    setErrorNovedades('');
    const resultados = await Promise.allSettled([
      fetch(`${API}/api/eventos/`, { credentials: 'include' }).then(res => {
        if (!res.ok) throw new Error('No se pudo cargar los eventos.');
        return res.json();
      }),
      fetch(`${API}/api/novedades/`, { credentials: 'include' }).then(res => {
        if (!res.ok) throw new Error('No se pudieron cargar las novedades.');
        return res.json();
      }),
    ]);

    if (resultados[0].status === 'fulfilled') setEventos(resultados[0].value);
    else setError(resultados[0].reason.message);

    if (resultados[1].status === 'fulfilled') setNovedades(resultados[1].value);
    else setErrorNovedades(resultados[1].reason.message);

    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const eventosHoy = eventos
    .map(ev => ({
      ...ev,
      tareasHoy: (ev.tareas || []).filter(t => t.fecha_asignada === hoyStr),
    }))
    .filter(ev => ev.fecha_evento === hoyStr || ev.tareasHoy.length > 0);

  return (
    <main className="prog-page">
      <header className="event-topbar">
        <Link className="event-brand" to="/crear-evento" aria-label="EventPro, inicio">
          <span className="event-brand-mark" aria-hidden="true">E</span>
          <span>EventPro</span>
        </Link>
        <nav className="event-nav" aria-label="Navegación principal">
          <Link to="/crear-evento">Crear evento</Link>
          <span className="event-nav-current" aria-current="page">Hoy</span>
          <Link to="/progreso">Mis eventos</Link>
        </nav>
        <div className="event-user-actions">
          <LogoutButton />
          <span className="event-user-mark" aria-label="Tu perfil">EP</span>
        </div>
      </header>

      <div className="prog-container">
        <div className="prog-head">
          <div>
            <p className="prog-kicker">EVENTOS DE HOY</p>
            <h1 className="prog-titulo">Eventos del día</h1>
            <p className="prog-subtitulo">Eventos y tareas programados para hoy.</p>
          </div>
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
            <button className="prog-action prog-action-primary" onClick={cargar} title="Intentar cargar los eventos de hoy otra vez">Reintentar</button>
          </div>
        )}

        {!cargando && !error && eventosHoy.length === 0 && (
          <div className="prog-estado">
            <span className="prog-vacio-icon">✦</span>
            <p>No tienes eventos ni tareas programados para hoy.</p>
          </div>
        )}

        {!cargando && !error && eventosHoy.length > 0 && (
          <div className="prog-eventos-lista">
            {eventosHoy.map(ev => (
              <article key={ev.id} className="prog-evento-card">
                <div className="prog-evento-header">
                  <div className="prog-evento-info">
                    <Link to={`/evento/${ev.id}`} className="prog-evento-nombre">{ev.nombre}</Link>
                    <p className="prog-evento-meta">
                      {ev.fecha_evento === hoyStr && `Evento · ${ev.hora_evento ? ev.hora_evento.slice(0, 5) : 'hora pendiente'} · `}
                      {ev.tareasHoy.length} tarea{ev.tareasHoy.length !== 1 ? 's' : ''} hoy
                    </p>
                  </div>
                </div>
                {ev.tareasHoy.length > 0 ? (
                  <div className="prog-tareas-lista">
                    {ev.tareasHoy.map(tarea => (
                      <div className="prog-tarea" key={tarea.id}>
                        <div className="prog-tarea-info">
                          <span className="prog-tarea-titulo">{tarea.titulo}</span>
                          <span className="prog-tarea-meta">
                            {tarea.hora_asignada ? tarea.hora_asignada.slice(0, 5) : 'Hora pendiente'} · {tarea.horas_estimadas}h
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="prog-sin-tareas-msg">Evento programado para hoy, sin subtareas asignadas.</p>
                )}
              </article>
            ))}
          </div>
        )}

        <section className="novedades-section" aria-labelledby="novedades-title">
          <div className="novedades-heading">
            <div>
              <p className="prog-kicker">ACTIVIDAD RECIENTE</p>
              <h2 id="novedades-title" className="novedades-title">Novedades</h2>
            </div>
          </div>
          {cargando && <p className="novedades-empty">Cargando novedades…</p>}
          {!cargando && errorNovedades && <p className="prog-estado-error" role="alert">{errorNovedades}</p>}
          {!cargando && !errorNovedades && novedades.length === 0 && (
            <p className="novedades-empty">Todavía no hay novedades recientes.</p>
          )}
          {!cargando && novedades.length > 0 && (
            <ol className="novedades-lista">
              {novedades.map(novedad => (
                <li className="novedades-item" key={novedad.id}>
                  <span className="novedades-marca" aria-hidden="true" />
                  <div className="novedades-contenido">
                    <Link to={`/evento/${novedad.evento}`} className="novedades-enlace">
                      {describirNovedad(novedad)}
                    </Link>
                    <time className="novedades-fecha" dateTime={novedad.fecha}>
                      {new Date(novedad.fecha).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
