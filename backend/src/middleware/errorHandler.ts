import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten() });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error(err);
  res.status(500).json({ error: message });
}
