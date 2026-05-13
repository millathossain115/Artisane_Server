import type mongoose from 'mongoose';

const handleValidationError = (err: mongoose.Error.ValidationError) => {
  const errorSources = Object.values(err.errors).map((value) => {
    return {
      path: value.path,
      message: value.message,
    };
  });

  return {
    statusCode: 400,
    message: 'Validation error',
    errorSources,
  };
};

export default handleValidationError;
