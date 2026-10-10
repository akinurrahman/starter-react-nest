import { errorResponseSchema, paginationMetaSchema } from '@starter/shared';
import { createZodDto } from 'nestjs-zod';

// Docs-only DTOs. Neither schema has defaults or transforms, so the input and
// output OpenAPI schemas are identical and the plain DTOs are used as is.
export class PaginationMetaDto extends createZodDto(paginationMetaSchema) {}

export class ErrorResponseDto extends createZodDto(errorResponseSchema) {}
