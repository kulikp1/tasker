import axios, { AxiosError } from 'axios';
import { getSocketId } from '@/stores/realtime';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const socketId = getSocketId();
  if (socketId) config.headers.set('X-Socket-Id', socketId);
  return config;
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').then(() => undefined).finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return api.request(original);
      } catch (refreshError) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown, fallback = 'Щось пішло не так'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (err.code === 'ERR_NETWORK') return 'Немає з’єднання з сервером';
  }
  return fallback;
}
