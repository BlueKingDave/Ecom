export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly code?: string) {
    super(message); this.name = 'AppError';
  }
}
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, id ? `${resource} '${id}' not found` : `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
export class ForbiddenError extends AppError {
  constructor(msg = 'Access denied') { super(403, msg, 'FORBIDDEN'); this.name = 'ForbiddenError'; }
}
export class ValidationError extends AppError {
  constructor(msg: string) { super(400, msg, 'VALIDATION_ERROR'); this.name = 'ValidationError'; }
}
export class ConflictError extends AppError {
  constructor(msg: string) { super(409, msg, 'CONFLICT'); this.name = 'ConflictError'; }
}
