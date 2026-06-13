/**
 * Base exception class for all application errors.
 * Provides structured error responses with HTTP status codes.
 */
export abstract class BaseException extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export class BadRequestException extends BaseException {
  constructor(message = 'Bad Request', errors?: Record<string, string[]>) {
    super(message, 400, errors);
  }
}

export class UnauthorizedException extends BaseException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenException extends BaseException {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundException extends BaseException {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictException extends BaseException {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class UnprocessableEntityException extends BaseException {
  constructor(message = 'Unprocessable Entity', errors?: Record<string, string[]>) {
    super(message, 422, errors);
  }
}

export class InternalServerException extends BaseException {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}
