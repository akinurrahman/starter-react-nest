import { STATUS_CODES } from 'node:http';
import { applyDecorators, HttpStatus, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import type { ZodDto } from 'nestjs-zod';
import { ErrorResponseDto, PaginationMetaDto } from './swagger.dtos.js';

// These describe the body after ResponseInterceptor / AllExceptionsFilter have
// shaped it, not the raw controller return value.

type Model = Type<unknown>;

interface DataResponseOptions {
  status?: number;
  description?: string;
}

// Responses are documented with the zod "output" schema (defaults applied,
// transforms run), which is what the client actually receives. nestjs-zod
// names it `<Dto>_Output`.
function responseModel(model: Model): Model {
  if ('isZodDto' in model && 'schema' in model) {
    const dto = model as unknown as ZodDto;
    if (!dto.codec && '_zod' in dto.schema) return dto.Output as Model;
  }
  return model;
}

function describe(status: number, description?: string): string {
  return description ?? STATUS_CODES[status] ?? `HTTP ${status}`;
}

export function ApiDataResponse(
  model: Model | [Model],
  { status = HttpStatus.OK, description }: DataResponseOptions = {},
) {
  const isArray = Array.isArray(model);
  const docModel = responseModel(isArray ? model[0] : model);
  const ref = { $ref: getSchemaPath(docModel) };

  return applyDecorators(
    ApiExtraModels(docModel),
    ApiResponse({
      status,
      description: describe(status, description),
      schema: {
        type: 'object',
        required: ['data'],
        properties: {
          data: isArray ? { type: 'array', items: ref } : ref,
        },
      },
    }),
  );
}

export function ApiPaginatedResponse(
  model: Model,
  summaryModel?: Model,
  { status = HttpStatus.OK, description }: DataResponseOptions = {},
) {
  const docModel = responseModel(model);
  const docSummary = summaryModel && responseModel(summaryModel);

  return applyDecorators(
    ApiExtraModels(
      docModel,
      PaginationMetaDto,
      ...(docSummary ? [docSummary] : []),
    ),
    ApiResponse({
      status,
      description: describe(status, description),
      schema: {
        type: 'object',
        required: ['data', 'pagination'],
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(docModel) } },
          pagination: { $ref: getSchemaPath(PaginationMetaDto) },
          ...(docSummary && {
            summary: { $ref: getSchemaPath(docSummary) },
          }),
        },
      },
    }),
  );
}

export function ApiErrorResponses(...statuses: number[]) {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: describe(status),
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
      }),
    ),
  );
}
