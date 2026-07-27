import { User } from '../user/user.model.js';
import type { IActivityLogContext } from '../activityLog/activityLog.interface.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import type { IAddress } from './address.model.js';
import { Address } from './address.model.js';

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

export const createAddress = async (
  userId: string,
  payload: Partial<IAddress>,
  activityContext?: IActivityLogContext,
) => {
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

  await ActivityLogServices.recordActivity({
    ...activityContext,
    action: 'address.created',
    actorId: userId,
    actorRole: activityContext?.actorRole ?? 'user',
    module: 'users',
    severity: 'low',
    source: activityContext?.source ?? 'user',
    status: 'success',
    summary: `Address was created`,
    targetId: created._id.toString(),
    targetLabel: created.label || created.city,
    targetType: 'address',
  });

  return created;
};

export const getMyAddresses = async (userId: string) => {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

export const updateAddress = async (
  userId: string,
  addressId: string,
  payload: Partial<IAddress>,
  activityContext?: IActivityLogContext,
) => {
  const existingAddress = await Address.findOne({ _id: addressId, user: userId });

  if (payload.isDefault) {
    await unsetOtherDefaults(userId);
  }

  const updated = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    payload,
    { returnDocument: 'after', runValidators: true },
  );

  if (updated && updated.isDefault) {
    await syncUserDefaultAddress(userId, updated);
  }

  if (existingAddress && updated) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'address.updated',
      actorId: userId,
      actorRole: activityContext?.actorRole ?? 'user',
      changes: ActivityLogServices.buildActivityChanges(existingAddress, updated, [
        'label',
        'recipientName',
        'phone',
        'streetAddress',
        'city',
        'postalCode',
        'isDefault',
      ]),
      module: 'users',
      severity: 'low',
      source: activityContext?.source ?? 'user',
      status: 'success',
      summary: `Address was updated`,
      targetId: updated._id.toString(),
      targetLabel: updated.label || updated.city,
      targetType: 'address',
    });
  }

  return updated;
};

export const deleteAddress = async (
  userId: string,
  addressId: string,
  activityContext?: IActivityLogContext,
) => {
  const deleted = await Address.findOneAndDelete({
    _id: addressId,
    user: userId,
  });

  if (deleted?.isDefault) {
    const nextAddress = await Address.findOne({ user: userId }).sort({
      createdAt: -1,
    });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
      await syncUserDefaultAddress(userId, nextAddress);
    }
  }

  if (deleted) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'address.deleted',
      actorId: userId,
      actorRole: activityContext?.actorRole ?? 'user',
      module: 'users',
      severity: 'low',
      source: activityContext?.source ?? 'user',
      status: 'success',
      summary: `Address was deleted`,
      targetId: deleted._id.toString(),
      targetLabel: deleted.label || deleted.city,
      targetType: 'address',
    });
  }

  return deleted;
};

export const setDefaultAddress = async (
  userId: string,
  addressId: string,
  activityContext?: IActivityLogContext,
) => {
  const existingAddress = await Address.findOne({ _id: addressId, user: userId });
  await unsetOtherDefaults(userId);
  const updated = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { isDefault: true },
    { returnDocument: 'after' },
  );

  if (updated) {
    await syncUserDefaultAddress(userId, updated);
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'address.default_updated',
      actorId: userId,
      actorRole: activityContext?.actorRole ?? 'user',
      changes: ActivityLogServices.buildActivityChanges(existingAddress, updated, [
        'isDefault',
      ]),
      module: 'users',
      severity: 'low',
      source: activityContext?.source ?? 'user',
      status: 'success',
      summary: `Default address was updated`,
      targetId: updated._id.toString(),
      targetLabel: updated.label || updated.city,
      targetType: 'address',
    });
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
