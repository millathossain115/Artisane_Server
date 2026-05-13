import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middlewares/globalErrorHandler.js';
import notFoundRoute from './app/middlewares/notFoundRoute.js';
import router from './app/routes/index.js';

const app: Application = express();

// Parsers
app.use(express.json());
app.use(cors());

// Application routes
app.get('/', (req: Request, res: Response) => {
  res.send('Artisane Server is running');
});

app.use('/api/v1', router);
app.use(notFoundRoute);
app.use(globalErrorHandler);

export default app;
