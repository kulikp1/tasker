import { v2 as cloudinary } from 'cloudinary';
import { env } from './src/config/env';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

const PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const stream = cloudinary.uploader.upload_stream({ folder: 'tasker/tasks' }, (error: any, result: any) => {
  if (error) {
    console.error('UPLOAD_FAILED full error:', JSON.stringify(error, null, 2));
  } else {
    console.log('UPLOAD_OK:', JSON.stringify(result));
  }
});
stream.end(Buffer.from(PIXEL_PNG_BASE64, 'base64'));
