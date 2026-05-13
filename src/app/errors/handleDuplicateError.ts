const handleDuplicateError = (err: { message: string }) => {
  const matchedArray = err.message.match(/"([^"]*)"/);
  const extractedMessage = matchedArray?.[1] || 'Duplicate value';

  return {
    statusCode: 400,
    message: 'Duplicate entry',
    errorSources: [
      {
        path: '',
        message: `${extractedMessage} already exists`,
      },
    ],
  };
};

export default handleDuplicateError;
