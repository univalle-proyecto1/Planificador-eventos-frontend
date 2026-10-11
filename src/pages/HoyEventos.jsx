import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Hoy.css';

const API = 'http://127.0.0.1:8000';

export default function HoyEventos() {
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

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Filter events that have at least one task for today
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  
  const eventosHoy = eventos.filter(ev =>
    (ev.tareas || []).some(t => t.fecha_asignada === hoyStr)
  );

  return (
    <main className="prog-page">
      <header className="event-topbar">
        <Link className="event-brand" to="/hoy" aria-label="EventPro, inicio">
          <span className="event-brand-mark" aria-hidden="true">E</span>
          <span>EventPro</span>
        </Link>
        <nav className="event-nav" aria-label="Navegación principal">
          <Link to="/hoy">Crear evento</Link>
          <Link to="/progreso">Mis eventos</Link>
          <Link to="/hoy-eventos">HOY</Link>
        </nav>
        <span className="event-user-mark" aria-label="Tu perfil">EP</span>
      </header>

      <div className="prog-container">
        <div className="prog-head">
          <div>
            <p className="prog-kicker">EVENTOS DE HOY</p>
            <h1 className="prog-titulo">Eventos del día</h1>
            <p className="prog-subtitulo">Los eventos que tienen tareas programadas para hoy.</p>
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
            <button className="prog-action prog-action-primary" onClick={cargar}>Reintentar</button>
          </div>
        )}

        {!cargando && !error && eventosHoy.length === 0 && (
          <div className="prog-estado">
            <span className="prog-vacio-icon">✦</span>
            <p>No hay eventos con tareas para hoy.</p>
          </div>
        )}

        {!cargando && !error && eventosHoy.length > 0 && (
          <div className="prog-eventos-lista">
            {eventosHoy.map(ev => {
              const tareas = ev.tareas || [];
              const total = tareas.length;
              const hechas = tareas.filter(t => t.estado === 'HECHO');
              const enProgreso = tareas.filter(t => t.estado === 'EN_PROGRESO');
              const pendientes = tareas.filter(t => t.estado === 'PENDIENTE');
              const pctHechas = total > 0 ? (hechas.length / total) * 100 : 0;
              const pctEnProgreso = total > 0 ? (enProgreso.length / total) * 100 : 0;
              const pct = total > 0 ? Math.min(100, Math.round(((hechas.length + enProgreso.length * 0.5) / total) * 100)) : 0;

              return (
                <article key={ev.id} className="prog-evento-card">
                  <div className="prog-evento-header">
                    <div className="prog-evento-info">
                      <Link to={`/evento/${ev.id}`} className="prog-evento-nombre">{ev.nombre} →</Link>
                      <p className="prog-evento-meta">
                        {total} tarea{total !== 1 ? 's' : ''}
                        {total > 0 && ` · ${pct}% de avance`}
                      </p>
                    </div>
                  </div>
                  {total > 0 && (
                    <>
                      <div className="prog-barra-wrap">
                        <div className="prog-barra">
                          <div className="prog-barra-fill prog-barra-hecho" style={{ width: `${pctHechas}%` }} />
                          <div className="prog-barra-fill prog-barra-progreso" style={{ width: `${pctEnProgreso}%` }} />
                        </div>
                        <span className="prog-barra-pct">{pct}% avance</span>
                      </div>
                      <div className="prog-pills-row">
                        <span className="prog-pill pill-hecho">✓ {hechas.length} completadas</span>
                        {enProgreso.length > 0 && <span className="prog-pill pill-progreso">↻ {enProgreso.length} en curso</span>}
                        <span className="prog-pill pill-pendiente">⏳ {pendientes.length} pendientes</span>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
