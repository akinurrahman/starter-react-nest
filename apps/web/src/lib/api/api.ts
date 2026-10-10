import axios from 'axios';
import { env } from '@/lib/env';
import { toApiError } from './api-error';

export const api = axios.create({
  baseURL: `${env.VITE_API_BASE_URL}/api`,
  // The api parses queries with Express's simple parser: a=1&a=2 becomes an
  // array, while a[]=1 stays a literal key named "a[]".
  paramsSerializer: { indexes: null },
});

// Keep this the last response interceptor. Any added before it (401 refresh
// and retry) need the raw AxiosError and its config; callers get ApiError.
api.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(toApiError(error)),
);
