import type { Express } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import config from '../config/index.js';
import AppError from '../errors/appError.js';

let isConfigured = false;

const ensureCloudinaryConfigured = () => {
  if (isConfigured) {
    return;
  }

  const { cloud_name, api_key, api_secret } = config.cloudinary;

  if (!cloud_name || !api_key || !api_secret) {
    throw new AppError(500, 'Cloudinary credentials are not configured');
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
  });

  isConfigured = true;
};

export const uploadImageToCloudinary = (
  file: Express.Multer.File,
  folder: string,
): Promise<string> => {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result?: UploadApiResponse) => {
        if (error) {
          reject(new AppError(500, 'Failed to upload image to Cloudinary'));
          return;
        }

        if (!result?.secure_url) {
          reject(new AppError(500, 'Cloudinary did not return an image URL'));
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(file.buffer);
  });
};
