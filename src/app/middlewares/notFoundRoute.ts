import type { Request, Response } from 'express';

const notFoundRoute = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export default notFoundRoute;
