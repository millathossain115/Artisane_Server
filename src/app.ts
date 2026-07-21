import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middlewares/globalErrorHandler.js';
import notFoundRoute from './app/middlewares/notFoundRoute.js';
import router from './app/routes/index.js';
import { uploadBaseDir } from './app/utils/uploadPaths.js';

const app: Application = express();

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(uploadBaseDir));

// Application routes
app.get('/', (req: Request, res: Response) => {
  res.send('Artisane Server is running');
});

app.use('/api/v1', router);
app.use(router);
app.use(notFoundRoute);
app.use(globalErrorHandler);

export default app;
