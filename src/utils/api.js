/**
 * Extracts a human-readable error string from a Django REST Framework response JSON.
 */
export function parseApiError(data, defaultMsg = 'Ocurrió un error inesperado.') {
	if (!data) return defaultMsg;
	if (typeof data === 'string') return data;
	if (data.detail && typeof data.detail === 'string') return data.detail;
	if (data.message && typeof data.message === 'string') return data.message;
	if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(' ');

	// If data is an object with field arrays
	if (typeof data === 'object') {
		const messages = [];
		for (const [key, value] of Object.entries(data)) {
			if (key === 'errors' && typeof value === 'object') {
				return parseApiError(value, defaultMsg);
			}
			const fieldName = key === 'detail' || key === 'non_field_errors' ? '' : `${key}: `;
			if (Array.isArray(value)) {
				messages.push(`${fieldName}${value.join(' ')}`);
			} else if (typeof value === 'string') {
				messages.push(`${fieldName}${value}`);
			}
		}
		if (messages.length > 0) return messages.join(' | ');
	}

	return defaultMsg;
}

/**
 * Fetches CSRF token from backend
 */
export async function getCsrfToken() {
	try {
		const response = await fetch('/api/auth/csrf/');
		if (response.ok) {
			const data = await response.json();
			return data.csrfToken || '';
		}
	} catch (err) {
		console.error('Error al obtener CSRF token:', err);
	}
	return '';
}
