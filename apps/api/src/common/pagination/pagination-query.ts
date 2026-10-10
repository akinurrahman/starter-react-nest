import { paginationQuerySchema } from '@starter/shared';
import { createZodDto } from 'nestjs-zod';

export class PaginationQueryDto extends createZodDto(paginationQuerySchema) {}
