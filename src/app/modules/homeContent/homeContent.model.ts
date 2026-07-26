import { Schema, model } from 'mongoose';
import type { Document } from 'mongoose';

export interface IHomeHeroSlide {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  imageAlt: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  isActive: boolean;
  sortOrder: number;
}

export interface IHomeHeroContent {
  isActive: boolean;
  autoplaySeconds: number;
  fadeMs: number;
  slides: IHomeHeroSlide[];
}

export type HomeHeroContentDocument = Document & IHomeHeroContent;

const homeHeroSlideSchema = new Schema<IHomeHeroSlide>(
  {
    eyebrow: { type: String, trim: true, default: 'New in the atelier' },
    title: { type: String, trim: true, default: 'Artisane' },
    description: {
      type: String,
      trim: true,
      default:
        'Shop stocked kits, tools, and craft materials from the latest marketplace edit.',
    },
    image: { type: String, trim: true },
    imageAlt: {
      type: String,
      trim: true,
      default: 'Living room with abstract wall painting',
    },
    primaryButtonText: { type: String, trim: true, default: 'Shop products' },
    primaryButtonLink: { type: String, trim: true, default: '/products' },
    secondaryButtonText: {
      type: String,
      trim: true,
      default: 'Browse categories',
    },
    secondaryButtonLink: { type: String, trim: true, default: '/categories' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const homeHeroContentSchema = new Schema<HomeHeroContentDocument>(
  {
    isActive: { type: Boolean, default: true },
    autoplaySeconds: { type: Number, min: 1, max: 10, default: 5 },
    fadeMs: { type: Number, min: 300, max: 1500, default: 800 },
    slides: {
      type: [homeHeroSlideSchema],
      default: [],
      validate: {
        validator(slides: IHomeHeroSlide[]) {
          return slides.length <= 5;
        },
        message: 'Hero can have up to 5 slides',
      },
    },
  },
  { timestamps: true },
);

export const HomeHeroContent = model<HomeHeroContentDocument>(
  'HomeHeroContent',
  homeHeroContentSchema,
);
