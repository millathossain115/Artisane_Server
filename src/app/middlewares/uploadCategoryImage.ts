import fs from 'fs';
import path from 'path';
import multer from 'multer';
import AppError from '../errors/appError.js';

const categoryUploadDir = path.join(process.cwd(), 'uploads', 'categories');

fs.mkdirSync(categoryUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, categoryUploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const uniqueName = `category-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
    return;
  }

  cb(new AppError(400, 'Only image files are allowed'));
};

const uploadCategoryImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default uploadCategoryImage;
