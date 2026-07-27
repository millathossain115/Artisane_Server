import type { Request, Response } from 'express';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import { AddressService } from './address.service.js';

export const createAddressHandler = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const result = await AddressService.createAddress(
    userId,
    req.body,
    ActivityLogServices.createActivityContext(req),
  );
  res.status(201).json({
    success: true,
    message: 'Address created successfully',
    data: result,
  });
};

export const getMyAddressesHandler = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const result = await AddressService.getMyAddresses(userId);
  res.status(200).json({
    success: true,
    message: 'Addresses retrieved successfully',
    data: result,
  });
};

export const updateAddressHandler = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const id = String(req.params.id);
  const result = await AddressService.updateAddress(
    userId,
    id,
    req.body,
    ActivityLogServices.createActivityContext(req),
  );
  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: result,
  });
};

export const deleteAddressHandler = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const id = String(req.params.id);
  const result = await AddressService.deleteAddress(
    userId,
    id,
    ActivityLogServices.createActivityContext(req),
  );
  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: result,
  });
};

export const setDefaultAddressHandler = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const id = String(req.params.id);
  const result = await AddressService.setDefaultAddress(
    userId,
    id,
    ActivityLogServices.createActivityContext(req),
  );
  res.status(200).json({
    success: true,
    message: 'Default address updated',
    data: result,
  });
};

export const AddressController = {
  createAddressHandler,
  getMyAddressesHandler,
  updateAddressHandler,
  deleteAddressHandler,
  setDefaultAddressHandler,
};
