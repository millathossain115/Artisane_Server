import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import { uploadImageToCloudinary } from '../../utils/cloudinary.js';
import sendResponse from '../../utils/sendResponse.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import { HomeContentServices } from './homeContent.service.js';
import type { HomeHeroContentPayload } from './homeContent.service.js';
import { HomeContentValidations } from './homeContent.validation.js';
import type { IHomeHeroSlide } from './homeContent.model.js';

const getUploadedSlideImages = async (req: Request) => {
  const files = Array.isArray(req.files)
    ? (req.files as Express.Multer.File[])
    : [];
  const uploadedImages = new Map<number, string>();

  await Promise.all(
    files.map(async (file) => {
      const match = /^slideImage-(\d+)$/.exec(file.fieldname);

      if (!match?.[1]) {
        return;
      }

      const slideIndex = Number(match[1]);
      const imageUrl = await uploadImageToCloudinary(file, 'artisane/home');
      uploadedImages.set(slideIndex, imageUrl);
    }),
  );

  return uploadedImages;
};

const cleanSlidePayload = (
  slide: Record<string, unknown>,
): Partial<IHomeHeroSlide> => {
  const cleanSlide: Partial<IHomeHeroSlide> = {};

  if (typeof slide.eyebrow === 'string') cleanSlide.eyebrow = slide.eyebrow;
  if (typeof slide.title === 'string') cleanSlide.title = slide.title;
  if (typeof slide.description === 'string') {
    cleanSlide.description = slide.description;
  }
  if (typeof slide.image === 'string') cleanSlide.image = slide.image;
  if (typeof slide.imageAlt === 'string') cleanSlide.imageAlt = slide.imageAlt;
  if (typeof slide.primaryButtonText === 'string') {
    cleanSlide.primaryButtonText = slide.primaryButtonText;
  }
  if (typeof slide.primaryButtonLink === 'string') {
    cleanSlide.primaryButtonLink = slide.primaryButtonLink;
  }
  if (typeof slide.secondaryButtonText === 'string') {
    cleanSlide.secondaryButtonText = slide.secondaryButtonText;
  }
  if (typeof slide.secondaryButtonLink === 'string') {
    cleanSlide.secondaryButtonLink = slide.secondaryButtonLink;
  }
  if (typeof slide.isActive === 'boolean') cleanSlide.isActive = slide.isActive;
  if (typeof slide.sortOrder === 'number') cleanSlide.sortOrder = slide.sortOrder;

  return cleanSlide;
};

const parseHeroPayload = (req: Request): HomeHeroContentPayload => {
  try {
    const rawHero = req.body.hero;
    const payload =
      typeof rawHero === 'string' && rawHero.trim()
        ? JSON.parse(rawHero)
        : req.body;

    const parsed =
      HomeContentValidations.updateHomeHeroValidationSchema.parse(payload);
    const cleanPayload: HomeHeroContentPayload = {};

    if (parsed.isActive !== undefined) cleanPayload.isActive = parsed.isActive;
    if (parsed.autoplaySeconds !== undefined) {
      cleanPayload.autoplaySeconds = parsed.autoplaySeconds;
    }
    if (parsed.fadeMs !== undefined) cleanPayload.fadeMs = parsed.fadeMs;
    if (parsed.slides !== undefined) {
      cleanPayload.slides = parsed.slides.map(cleanSlidePayload);
    }

    return cleanPayload;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AppError(400, 'Hero payload must be valid JSON');
    }

    if (error instanceof ZodError) {
      throw error;
    }

    throw error;
  }
};

const getHomeHeroHandler = async (_req: Request, res: Response) => {
  const hero = await HomeContentServices.getHomeHero();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Home hero content retrieved successfully',
    data: hero,
  });
};

const updateHomeHeroHandler = async (req: Request, res: Response) => {
  const payload = parseHeroPayload(req);
  const uploadedImages = await getUploadedSlideImages(req);
  const slides = payload.slides?.map((slide, index) => {
    const uploadedImage = uploadedImages.get(index);

    return uploadedImage ? { ...slide, image: uploadedImage } : slide;
  });
  const hero = await HomeContentServices.upsertHomeHero(
    {
      ...payload,
      ...(slides ? { slides } : {}),
    },
    ActivityLogServices.createActivityContext(req),
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Home hero content updated successfully',
    data: hero,
  });
};

export const HomeContentControllers = {
  getHomeHeroHandler,
  updateHomeHeroHandler,
};
