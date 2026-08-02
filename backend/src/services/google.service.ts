import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

const client = new OAuth2Client(env.googleClientId);

export interface GoogleProfile {
  email: string;
  googleId: string;
  name?: string;
  avatarUrl?: string;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const ticket = await client.verifyIdToken({ idToken: credential, audience: env.googleClientId });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw new Error('Invalid Google credential');
  }
  return {
    email: payload.email.toLowerCase(),
    googleId: payload.sub,
    name: payload.name,
    avatarUrl: payload.picture,
  };
}
