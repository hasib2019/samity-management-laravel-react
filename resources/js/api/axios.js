import axios from 'axios';

const base = document.querySelector('meta[name="app-base-url"]')?.content || window.location.origin;

// Cookie/session based SPA auth (Laravel Sanctum). The session lives in an
// HttpOnly cookie that JavaScript cannot read, eliminating XSS token theft.
const api = axios.create({
    baseURL: new URL('/api', base).toString(),
    withCredentials: true,           // send the session + XSRF cookies
    withXSRFToken: true,             // mirror the XSRF-TOKEN cookie into X-XSRF-TOKEN
    headers: {
        'Accept': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Session expired / not authenticated -> bounce to login. There are no
        // client-side auth artifacts to clear (token lives in an HttpOnly cookie).
        if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Fetches the XSRF-TOKEN cookie required before any state-changing request.
export const ensureCsrfCookie = () =>
    axios.get(new URL('/sanctum/csrf-cookie', base).toString(), { withCredentials: true });

export default api;
