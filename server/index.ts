import cors from 'cors';
import express from 'express';
import path from 'node:path';
import healthRouter from './routes/health.route.js';
const app = express();
const port = Number(process.env.PORT ?? 3001);
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.use('/api/health', healthRouter);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  },
);
app.listen(port, () =>
  console.log(`AppSec API running at http://localhost:${port}`),
);
