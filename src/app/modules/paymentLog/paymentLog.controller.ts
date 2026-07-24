import type { Request, Response } from 'express';
import {
  getAllPaymentLogs,
  getPaymentLogByPublicRef,
  getPaymentLogStats,
} from './paymentLog.service.js';

export const getPaymentLogsHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAllPaymentLogs(req.query);
    res.status(200).json({
      success: true,
      message: 'Payment logs retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error ? error.message : 'Failed to fetch payment logs';
    res.status(500).json({
      success: false,
      message: errMessage,
    });
  }
};

export const getPaymentLogByPublicRefHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { publicRef } = req.params;

    if (!publicRef || Array.isArray(publicRef)) {
      res.status(400).json({
        success: false,
        message: 'Payment log public reference is required',
      });
      return;
    }

    const result = await getPaymentLogByPublicRef(publicRef);

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Payment log not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Payment log retrieved successfully',
      data: result,
    });
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error ? error.message : 'Failed to fetch payment log';
    res.status(500).json({
      success: false,
      message: errMessage,
    });
  }
};

export const getPaymentLogStatsHandler = async (
  _req: Request,
  res: Response,
) => {
  try {
    const stats = await getPaymentLogStats();
    res.status(200).json({
      success: true,
      message: 'Payment log stats fetched successfully',
      data: stats,
    });
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error ? error.message : 'Failed to fetch payment stats';
    res.status(500).json({
      success: false,
      message: errMessage,
    });
  }
};
