import { paginationMetaSchema, type PaginatedResponse } from '@starter/shared';
import type { AxiosResponse } from 'axios';
import { api } from './api';
import { badResponse } from './api-error';

type ParamValue = string | number | boolean | Date | null | undefined;

export type QueryParams = Record<string, ParamValue | readonly ParamValue[]>;

export type ApiCallOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

// A handler that returns nothing gets a 200 with an empty body, and a 204 has
// none either. Both resolve to undefined. A null return is { data: null }.
export async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {},
): Promise<T> {
  const response = await send(endpoint, options);
  if (isEmpty(response.data)) return undefined as T;

  const body: unknown = response.data;
  if (!isRecord(body) || !('data' in body)) throw badResponse(response.status);
  return body.data as T;
}

export async function apiCallPaginated<T, S = undefined>(
  endpoint: string,
  options: ApiCallOptions = {},
): Promise<PaginatedResponse<T, S>> {
  const response = await send(endpoint, options);

  const body: unknown = response.data;
  if (
    !isRecord(body) ||
    !Array.isArray(body.data) ||
    !paginationMetaSchema.safeParse(body.pagination).success
  ) {
    throw badResponse(response.status);
  }
  return body as PaginatedResponse<T, S>;
}

function send(
  endpoint: string,
  { method = 'GET', body, params, signal, headers }: ApiCallOptions,
): Promise<AxiosResponse<unknown>> {
  return api.request({
    url: endpoint,
    method,
    data: body,
    params,
    signal,
    headers,
  });
}

function isEmpty(data: unknown): boolean {
  return data === undefined || data === '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
