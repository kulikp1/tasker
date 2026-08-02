import mongoose from 'mongoose';
import { env } from '../config/env';

let connectPromise: Promise<typeof mongoose> | null = null;

export function connectDb(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }
  if (!connectPromise) {
    // A warm serverless instance reuses this module between invocations, so a rejected
    // promise must not stick around forever - clear it so the next call can retry.
    connectPromise = mongoose.connect(env.mongodbUri).catch((err) => {
      connectPromise = null;
      throw err;
    });
  }
  return connectPromise;
}
