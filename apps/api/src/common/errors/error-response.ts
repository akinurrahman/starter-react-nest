import { z } from 'zod';

export const fieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
  code: z.string(),
});

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  errors: z.array(fieldErrorSchema).optional(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
