import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './app/docs/openapi.js';
import { swaggerUiOptions } from './app/docs/swaggerTheme.js';
import ensureDatabaseConnected from './app/middlewares/ensureDatabaseConnected.js';
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
  res.redirect('/docs');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Artisane Server is running',
  });
});

app.get('/openapi.json', (req: Request, res: Response) => {
  res.status(200).json(openApiDocument);
});

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, swaggerUiOptions),
);
app.use('/api/v1', ensureDatabaseConnected, router);
app.use(ensureDatabaseConnected, router);
app.use(notFoundRoute);
app.use(globalErrorHandler);

export default app;
