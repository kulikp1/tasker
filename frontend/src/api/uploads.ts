import { api } from './client';

async function resizeImage(file: File, maxDimension = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  return blob ?? file;
}

export async function uploadImage(file: File, folder: 'avatars' | 'tasks' | 'shopping'): Promise<string> {
  const resized = await resizeImage(file);
  const formData = new FormData();
  formData.append('file', resized, file.name.replace(/\.[^.]+$/, '') + '.jpg');
  formData.append('folder', folder);
  const { data } = await api.post<{ url: string }>('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
