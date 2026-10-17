import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://127.0.0.1:8000';

export default function LogoutButton() {
	const navigate = useNavigate();
	const [cerrando, setCerrando] = useState(false);
	const [error, setError] = useState('');

	async function cerrarSesion() {
		setCerrando(true);
		setError('');
		try {
			const csrfResponse = await fetch(`${API}/api/auth/csrf/`, { credentials: 'include' });
			const { csrfToken } = await csrfResponse.json();
			if (!csrfResponse.ok || !csrfToken) throw new Error();

			const response = await fetch(`${API}/api/auth/logout/`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'X-CSRFToken': csrfToken },
			});
			if (!response.ok) throw new Error();
			navigate('/login', { replace: true });
		} catch {
			setError('No se pudo cerrar sesión. Inténtalo de nuevo.');
		} finally {
			setCerrando(false);
		}
	}

	return (
		<>
			<button className="event-logout" disabled={cerrando} onClick={cerrarSesion} type="button">
				{cerrando ? 'Cerrando…' : 'Cerrar sesión'}
			</button>
			{error && <span className="event-logout-error" role="alert">{error}</span>}
		</>
	);
}