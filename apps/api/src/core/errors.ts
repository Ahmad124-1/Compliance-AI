import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Application error with an HTTP status code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, 'CONFLICT', message);
  }
}

/**
 * Centralized error handler for Fastify.
 */
export async function errorHandler(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.code,
      message: error.message,
      details: error.details,
    });
  }

  // Fastify validation errors (zod via type-provider) keep statusCode 400.
  const maybe = error as { statusCode?: number; validation?: unknown };
  if (maybe.validation) {
    return reply.code(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: maybe.validation,
    });
  }

  request.log.error(error);
  return reply.code(maybe.statusCode ?? 500).send({
    error: 'INTERNAL_ERROR',
    message: maybe.statusCode ? (error as Error).message : 'Internal server error',
  });
}
