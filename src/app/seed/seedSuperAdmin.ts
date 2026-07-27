import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import config from '../config/index.js';
import { USER_ROLE, USER_STATUS } from '../modules/user/user.constant.js';
import { User } from '../modules/user/user.model.js';
import { connectToDatabase } from '../utils/database.js';

async function runSeed() {
  if (!config.super_admin.email || !config.super_admin.password) {
    throw new Error(
      'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required to run the super admin seed',
    );
  }

  await connectToDatabase();

  try {
    const email = config.super_admin.email.trim().toLowerCase();
    const existingUser = await User.findOne({ email }).select('+password');
    const shouldSetPassword =
      !existingUser ||
      config.super_admin.reset_password ||
      !existingUser.password;
    const password = shouldSetPassword
      ? await bcrypt.hash(
          config.super_admin.password,
          Number(config.bcrypt_salt_rounds) || 10,
        )
      : existingUser?.password;

    const updatePayload = {
      email,
      isDeleted: false,
      name: config.super_admin.name,
      ...(password ? { password } : {}),
      ...(config.super_admin.phone ? { phone: config.super_admin.phone } : {}),
      role: USER_ROLE.super_admin,
      status: USER_STATUS.active,
    };

    await User.findOneAndUpdate(
      { email },
      { $set: updatePayload },
      {
        returnDocument: 'after',
        runValidators: true,
        upsert: true,
      },
    );

    console.log(
      existingUser
        ? `Super admin ${email} updated. Password ${
            config.super_admin.reset_password ? 'reset' : 'left unchanged'
          }.`
        : `Super admin ${email} created.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

runSeed().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exit(1);
});
