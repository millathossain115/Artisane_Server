import { Address } from './address.model.js';
import type { IAddress } from './address.model.js';
import { User } from '../user/user.model.js';

async function unsetOtherDefaults(userId: string) {
  await Address.updateMany({ user: userId }, { isDefault: false });
}

async function syncUserDefaultAddress(userId: string, address: IAddress) {
  await User.findByIdAndUpdate(userId, {
    address: address.streetAddress,
    city: address.city,
    postalCode: address.postalCode || '',
  });
}

export const createAddress = async (userId: string, payload: Partial<IAddress>) => {
  const existingCount = await Address.countDocuments({ user: userId });
  const isDefault = existingCount === 0 ? true : Boolean(payload.isDefault);

  if (isDefault) {
    await unsetOtherDefaults(userId);
  }

  const created = await Address.create({
    ...payload,
    user: userId,
    isDefault,
  });

  if (isDefault) {
    await syncUserDefaultAddress(userId, created);
  }

  return created;
};

export const getMyAddresses = async (userId: string) => {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

export const updateAddress = async (userId: string, addressId: string, payload: Partial<IAddress>) => {
  if (payload.isDefault) {
    await unsetOtherDefaults(userId);
  }

  const updated = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    payload,
    { new: true, runValidators: true }
  );

  if (updated && updated.isDefault) {
    await syncUserDefaultAddress(userId, updated);
  }

  return updated;
};

export const deleteAddress = async (userId: string, addressId: string) => {
  const deleted = await Address.findOneAndDelete({ _id: addressId, user: userId });

  if (deleted?.isDefault) {
    const nextAddress = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
      await syncUserDefaultAddress(userId, nextAddress);
    }
  }

  return deleted;
};

export const setDefaultAddress = async (userId: string, addressId: string) => {
  await unsetOtherDefaults(userId);
  const updated = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { isDefault: true },
    { new: true }
  );

  if (updated) {
    await syncUserDefaultAddress(userId, updated);
  }

  return updated;
};

export const AddressService = {
  createAddress,
  getMyAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
