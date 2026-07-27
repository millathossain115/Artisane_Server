import type { Request, Response } from 'express';
import { PromoService } from './promo.service.js';
import sendResponse from '../../utils/sendResponse.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';

export const getActivePromoHandler = async (_req: Request, res: Response) => {
  const promo = await PromoService.getActivePromo();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Active promo banner retrieved successfully',
    data: promo,
  });
};

export const updatePromoHandler = async (req: Request, res: Response) => {
  const promo = await PromoService.upsertPromo(
    req.body,
    ActivityLogServices.createActivityContext(req),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Promo banner updated successfully',
    data: promo,
  });
};

export const PromoController = {
  getActivePromoHandler,
  updatePromoHandler,
};
