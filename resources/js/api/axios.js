import axios from 'axios';
import i18n from '../i18n';

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

// Tell the backend which language to render __()/validation messages in —
// kept current with whatever i18next's active language is (see resources/js/i18n).
api.interceptors.request.use((config) => {
    config.headers['Accept-Language'] = i18n.language;
    return config;
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
