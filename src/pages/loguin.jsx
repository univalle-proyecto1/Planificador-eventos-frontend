import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './loguin.css';

const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT || '/api/auth/login';

function validate(values) {
	const errors = {};

	if (!values.email.trim()) {
		errors.email = 'Ingresa tu correo electrónico.';
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
		errors.email = 'Ingresa un correo electrónico válido.';
	}

	if (!values.password) {
		errors.password = 'Ingresa tu contraseña.';
	}

	return errors;
}

export default function Loguin() {
	const navigate = useNavigate();
	const [values, setValues] = useState({ email: '', password: '' });
	const [errors, setErrors] = useState({});
	const [status, setStatus] = useState('idle');
	const [serverError, setServerError] = useState('');

	function handleChange(event) {
		const { name, value } = event.target;
		setValues((current) => ({ ...current, [name]: value }));
		setErrors((current) => ({ ...current, [name]: '' }));
		setServerError('');
		if (status === 'success') setStatus('idle');
	}

	async function handleSubmit(event) {
		event.preventDefault();
		const validationErrors = validate(values);
		setErrors(validationErrors);
		setServerError('');

		if (Object.keys(validationErrors).length > 0) {
			setStatus('idle');
			return;
		}

		setStatus('loading');

		try {
			const response = await fetch(AUTH_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: values.email.trim(),
					password: values.password,
				}),
			});
			const result = await response.json().catch(() => ({}));

			if (!response.ok) {
				const message = result.message || result.error;
				if (result.errors && typeof result.errors === 'object') {
					setErrors((current) => ({ ...current, ...result.errors }));
				}
				throw new Error(message || 'No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.');
			}

			setStatus('success');
			navigate('/hoy', { replace: true });
		} catch (error) {
			setStatus('error');
			setServerError(
				error instanceof TypeError
					? 'No se pudo conectar con el servidor. Inténtalo de nuevo en unos momentos.'
					: error.message,
			);
		}
	}

	return (
		<main className="login-page">
			<section className="login-panel" aria-labelledby="login-title">
				<a className="login-brand" href="/" aria-label="Planifica, inicio">
					<span className="brand-mark" aria-hidden="true">P</span>
					<span>planifica</span>
				</a>

				<div className="login-content">
					<p className="login-eyebrow">Tu espacio de trabajo</p>
					<h1 id="login-title">Qué bueno verte.</h1>
					<p className="login-intro">Inicia sesión para continuar organizando tus eventos.</p>

					{status === 'success' ? (
						<div className="login-success" role="status" aria-live="polite">
							<span className="success-icon" aria-hidden="true">✓</span>
							<h2>Sesión iniciada</h2>
							<p>Tu acceso fue confirmado. Ya puedes volver a tu espacio de trabajo.</p>
							<button className="login-submit" type="button" onClick={() => navigate('/hoy')}>
								Ir a mi tablero
							</button>
						</div>
					) : (
						<form className="login-form" onSubmit={handleSubmit} noValidate>
							<div className="form-field">
								<label htmlFor="email">Correo electrónico</label>
								<input
									autoComplete="email"
									id="email"
									name="email"
									type="email"
									value={values.email}
									onChange={handleChange}
									aria-invalid={Boolean(errors.email)}
									aria-describedby={errors.email ? 'email-error' : undefined}
									disabled={status === 'loading'}
									placeholder="nombre@correo.com"
								/>
								{errors.email && <p className="field-error" id="email-error">{errors.email}</p>}
							</div>

							<div className="form-field">
								<label htmlFor="password">Contraseña</label>
								<input
									autoComplete="current-password"
									id="password"
									name="password"
									type="password"
									value={values.password}
									onChange={handleChange}
									aria-invalid={Boolean(errors.password)}
									aria-describedby={errors.password ? 'password-error' : undefined}
									disabled={status === 'loading'}
									placeholder="Escribe tu contraseña"
								/>
								{errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
							</div>

							{serverError && <p className="form-error" role="alert">{serverError}</p>}

							<button className="login-submit" type="submit" disabled={status === 'loading'}>
								{status === 'loading' ? (
									<><span className="loading-spinner" aria-hidden="true" />Ingresando...</>
								) : 'Iniciar sesión'}
							</button>
							<p className="auth-switch">
								¿Aún no tienes una cuenta? <Link to="/registro">Crear cuenta</Link>
							</p>
						</form>
					)}
				</div>

				<p className="login-footer">Planifica cada detalle. Disfruta cada momento.</p>
			</section>

			<aside className="login-aside" aria-label="Organización de eventos">
				<div className="aside-grid" aria-hidden="true" />
				<div className="aside-copy">
					<span className="aside-kicker">Menos pendientes, más celebración</span>
					<p>Todo tu evento,<br />en buenas manos.</p>
					<span className="aside-caption">Ideas claras. Días memorables.</span>
				</div>
				<div className="aside-stamp" aria-hidden="true">P</div>
			</aside>
		</main>
	);
}
