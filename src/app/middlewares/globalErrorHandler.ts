import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import AppError from '../errors/appError.js';
import handleCastError from '../errors/handleCastError.js';
import handleDuplicateError from '../errors/handleDuplicateError.js';
import handleValidationError from '../errors/handleValidationError.js';
import handleZodError from '../errors/handleZodError.js';

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  let message = err?.message || 'Something went wrong';
  let errorSources: { path: string; message: string }[] = [];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err?.name === 'CastError') {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err?.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  });
};

export default globalErrorHandler;
