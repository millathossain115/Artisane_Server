import type mongoose from 'mongoose';

const handleCastError = (err: mongoose.Error.CastError) => {
  return {
    statusCode: 400,
    message: 'Invalid ID',
    errorSources: [
      {
        path: err.path,
        message: err.message,
      },
    ],
  };
};

export default handleCastError;
