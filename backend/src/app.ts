import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env';
import { connectDb } from './db/connect';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { adminRouter } from './routes/admin.routes';
import { boardRouter } from './routes/board.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { uploadsRouter } from './routes/uploads.routes';
import { realtimeRouter } from './routes/realtime.routes';
import { financeRouter } from './routes/finance.routes';
import { shoppingRouter } from './routes/shopping.routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export const app = express();

// Health check must never wait on the DB - it's the one route mounted before the connect gate below.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((req, _res, next) => {
  connectDb().then(() => next(), next);
});

if (env.frontendOrigin) {
  app.use(cors({ origin: env.frontendOrigin, credentials: true }));
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/board', boardRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/finance', financeRouter);
app.use('/api/shopping', shoppingRouter);

app.use('/api', notFoundHandler);
app.use(errorHandler);
