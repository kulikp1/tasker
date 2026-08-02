import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Third-party integrations (Cloudinary, Pusher, Monobank token encryption) are optional at boot -
// a missing one should only break that specific feature at the point of use, not the whole server.
function optional(name: string): string {
  return process.env[name] ?? '';
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? '',
  mongodbUri: required('MONGODB_URI'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME'),
    apiKey: optional('CLOUDINARY_API_KEY'),
    apiSecret: optional('CLOUDINARY_API_SECRET'),
  },
  pusher: {
    appId: optional('PUSHER_APP_ID'),
    key: optional('PUSHER_KEY'),
    secret: optional('PUSHER_SECRET'),
    cluster: optional('PUSHER_CLUSTER'),
  },
  tokenEncryptionKey: optional('TOKEN_ENCRYPTION_KEY'),
  googleClientId: optional('GOOGLE_CLIENT_ID'),
  adminSeedEmail: optional('ADMIN_SEED_EMAIL'),
};
