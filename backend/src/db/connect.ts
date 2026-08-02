import mongoose from 'mongoose';
import { env } from '../config/env';

let connectPromise: Promise<typeof mongoose> | null = null;

export function connectDb(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }
  if (!connectPromise) {
    connectPromise = mongoose.connect(env.mongodbUri);
  }
  return connectPromise;
}
