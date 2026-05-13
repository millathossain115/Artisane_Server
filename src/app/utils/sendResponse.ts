import type { Response } from 'express';

type TErrorSource = {
  path: string;
  message: string;
};

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
  errorSources?: TErrorSource[];
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    meta: data.meta,
    data: data.data,
    errorSources: data.errorSources,
  });
};

export default sendResponse;
