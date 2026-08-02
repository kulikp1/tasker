import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { uploadImageBuffer } from '../services/cloudinary.service';

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Тільки зображення дозволені'));
      return;
    }
    cb(null, true);
  },
});

const ALLOWED_FOLDERS = new Set(['avatars', 'tasks', 'shopping']);

uploadsRouter.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Файл не передано' });
      return;
    }
    const folder = typeof req.body.folder === 'string' && ALLOWED_FOLDERS.has(req.body.folder) ? req.body.folder : 'misc';
    const url = await uploadImageBuffer(req.file.buffer, folder);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});
