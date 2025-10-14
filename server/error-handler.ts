import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface ErrorResponse {
  message: string;
  errors?: any[];
  code?: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof z.ZodError) {
    const response: ErrorResponse = {
      message: 'Datos inválidos',
      errors: err.errors,
      code: 'VALIDATION_ERROR'
    };
    return res.status(400).json(response);
  }

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      message: err.message,
      code: err.code
    };
    return res.status(err.statusCode).json(response);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  const response: ErrorResponse = {
    message,
    code: 'INTERNAL_ERROR'
  };

  if (!res.headersSent) {
    res.status(status).json(response);
  }
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = {
  badRequest: (message: string, code?: string) => 
    new AppError(400, message, code || 'BAD_REQUEST'),
  
  unauthorized: (message: string = 'No autorizado', code?: string) => 
    new AppError(401, message, code || 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Acceso prohibido', code?: string) => 
    new AppError(403, message, code || 'FORBIDDEN'),
  
  notFound: (message: string = 'Recurso no encontrado', code?: string) => 
    new AppError(404, message, code || 'NOT_FOUND'),
  
  conflict: (message: string, code?: string) => 
    new AppError(409, message, code || 'CONFLICT'),
  
  internal: (message: string = 'Error interno del servidor', code?: string) => 
    new AppError(500, message, code || 'INTERNAL_ERROR')
};
