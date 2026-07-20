import { createHmac, timingSafeEqual } from 'node:crypto';
import config from '../../config/index.js';
import AppError from '../../errors/appError.js';
import { OrderServices } from '../order/order.service.js';

const getSignatureValue = (signatureHeader?: string | string[]) => {
  const signature = Array.isArray(signatureHeader)
    ? signatureHeader[0]
    : signatureHeader;

  return (signature || '').replace(/^sha256=/, '').trim();
};

const verifySteadfastWebhookSignature = (
  payload: Record<string, unknown>,
  signatureHeader?: string | string[],
) => {
  const secret = config.delivery.steadfast_webhook_secret;

  if (!secret) {
    return;
  }

  const signature = getSignatureValue(signatureHeader);
  const expected = createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (
    !signature ||
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new AppError(401, 'Invalid Steadfast webhook signature');
  }
};

const handleSteadfastWebhook = async (
  payload: Record<string, unknown>,
  signatureHeader?: string | string[],
) => {
  verifySteadfastWebhookSignature(payload, signatureHeader);

  return OrderServices.handleSteadfastWebhook(payload);
};

export const DeliveryServices = {
  handleSteadfastWebhook,
};
