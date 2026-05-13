import type { ZodError } from 'zod';

const handleZodError = (err: ZodError) => {
  const errorSources = err.issues.map((issue) => {
    return {
      path: issue.path.join('.'),
      message: issue.message,
    };
  });

  return {
    statusCode: 400,
    message: 'Validation error',
    errorSources,
  };
};

export default handleZodError;
