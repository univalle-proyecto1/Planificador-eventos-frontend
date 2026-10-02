import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header({ currentPage }) {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);

	useEffect(() => {
		checkUserSession();
	}, []);

	async function checkUserSession() {
		try {
			const res = await fetch('/api/auth/me/');
			if (res.ok) {
				const data = await res.json();
				if (data.authenticated) {
					setUser(data.user);
				} else {
					navigate('/login');
				}
			}
		} catch (err) {
			console.error('Error al verificar sesión:', err);
		}
	}

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout/', { method: 'POST' });
		} catch (err) {
			console.error('Error al cerrar sesión:', err);
		} finally {
			navigate('/login');
		}
	}

	const getInitials = (name) => {
		if (!name) return 'EP';
		const parts = name.trim().split(' ');
		if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		return name.slice(0, 2).toUpperCase();
	};

	return (
		<header className="event-topbar">
			<Link className="event-brand" to="/hoy" aria-label="EventPro, inicio">
				<span className="event-brand-mark" aria-hidden="true">E</span>
				<span>EventPro</span>
			</Link>
			<nav className="event-nav" aria-label="Navegación principal">
				<Link to="/hoy" className={currentPage === 'crear' || currentPage === 'hoy' ? 'event-nav-current' : ''}>
					Crear evento
				</Link>
				<Link to="/progreso" className={currentPage === 'progreso' ? 'event-nav-current' : ''}>
					Mis eventos
				</Link>
			</nav>

			<div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifySelf: 'end' }}>
				{user && (
					<span style={{ fontSize: '12px', color: '#68776d', fontWeight: 'bold' }}>
						{user.name}
					</span>
				)}
				<span className="event-user-mark" title={user ? user.name : 'Tu perfil'}>
					{getInitials(user?.name)}
				</span>
				<button
					type="button"
					onClick={handleLogout}
					title="Cerrar sesión"
					style={{
						background: 'none',
						border: '1px solid #dce4db',
						borderRadius: '5px',
						color: '#68776d',
						cursor: 'pointer',
						fontSize: '11px',
						fontWeight: 'bold',
						padding: '4px 8px',
						transition: 'all 150ms ease',
					}}
				>
					Salir 🚪
				</button>
			</div>
		</header>
	);
}
