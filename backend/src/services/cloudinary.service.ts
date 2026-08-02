import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new Error('Cloudinary не налаштований — додайте CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET у backend/.env');
  }
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  configured = true;
}

export async function uploadImageBuffer(buffer: Buffer, folder: string): Promise<string> {
  ensureConfigured();
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `tasker/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result as { secure_url: string });
      }
    );
    stream.end(buffer);
  });
  return result.secure_url;
}
