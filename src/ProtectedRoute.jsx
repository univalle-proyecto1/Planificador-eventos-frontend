import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ME_ENDPOINT = import.meta.env.VITE_ME_ENDPOINT || '/api/auth/me/';

// Protege las rutas internas: si no hay sesión activa redirige al login.
export default function ProtectedRoute() {
  const [estado, setEstado] = useState('cargando'); // cargando | autenticado | anonimo

  useEffect(() => {
    let activo = true;
    fetch(ME_ENDPOINT, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => {
        if (activo) setEstado(data.authenticated ? 'autenticado' : 'anonimo');
      })
      .catch(() => {
        if (activo) setEstado('anonimo');
      });
    return () => {
      activo = false;
    };
  }, []);

  if (estado === 'cargando') return null;
  if (estado === 'anonimo') return <Navigate to="/login" replace />;
  return <Outlet />;
}
