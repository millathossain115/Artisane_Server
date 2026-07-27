import mongoose, { Query } from 'mongoose';
import config from '../../config/index.js';
import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import { createPaymentLog } from '../paymentLog/paymentLog.service.js';
import { Product } from '../product/product.model.js';
import { PromoBanner } from '../promo/promo.model.js';
import { ShippingServices } from '../shipping/shipping.service.js';
import type { IActivityLogContext } from '../activityLog/activityLog.interface.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import { User } from '../user/user.model.js';
import {
  CANCELLABLE_ORDER_STATUSES,
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from './order.constant.js';
import type {
  ICreateOrderPayload,
  ICreateShipmentPayload,
  IOrder,
  IOrderItem,
} from './order.interface.js';
import { Order } from './order.model.js';

type TSslcommerzSessionResponse = {
  status?: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  redirectGatewayURL?: string;
  desc?: {
    gw?: string;
    redirectGatewayURL?: string;
  }[];
};

type TSslcommerzValidationResponse = {
  status?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  bank_tran_id?: string;
  card_type?: string;
  risk_level?: string;
};

const SSLCOMMERZ_BASE_URL = config.sslcommerz.is_live
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

const ONLINE_PAYMENT_METHODS = new Set<string>([
  PAYMENT_METHOD.sslcommerz,
  PAYMENT_METHOD.bkash,
  PAYMENT_METHOD.nagad,
  PAYMENT_METHOD.rocket,
]);

const PAYMENT_METHOD_GATEWAYS: Partial<Record<string, string>> = {
  [PAYMENT_METHOD.bkash]: 'bkash',
  [PAYMENT_METHOD.nagad]: 'nagad',
  [PAYMENT_METHOD.rocket]: 'rocket',
};

const populateOrder = <T>(query: Query<T, IOrder>) =>
  query.populate('user', 'name email role').populate({
    path: 'items.product',
    select: 'name slug price category images',
    populate: {
      path: 'category',
      select: 'name slug',
    },
  });

const generateTransactionId = () => {
  return `ART${Date.now()}${Math.round(Math.random() * 1e6)}`;
};

const getOrderLogTargetId = (
  order: Pick<IOrder, '_id' | 'transactionId'>,
  fallbackId = '',
) => order._id?.toString() ?? fallbackId;

const getOrderLogLabel = (
  order: Pick<IOrder, '_id' | 'transactionId'>,
  fallbackId = 'order',
) => order.transactionId ?? order._id?.toString() ?? fallbackId;

const getSslcommerzCredentials = () => {
  const storeId = config.sslcommerz.store_id;
  const storePassword = config.sslcommerz.store_password;

  if (!storeId || !storePassword) {
    throw new AppError(500, 'SSLCommerz credentials are not configured');
  }

  return { storeId, storePassword };
};

const getPaymentRedirectUrl = (
  response: TSslcommerzSessionResponse,
  paymentMethod: string,
) => {
  const gateway = PAYMENT_METHOD_GATEWAYS[paymentMethod];

  if (gateway && Array.isArray(response.desc)) {
    const matchedGateway = response.desc.find((item) => item.gw === gateway);

    if (matchedGateway?.redirectGatewayURL) {
      return matchedGateway.redirectGatewayURL;
    }
  }

  return response.GatewayPageURL || response.redirectGatewayURL;
};

const initiateSslcommerzPayment = async (
  order: IOrder & { _id: { toString(): string }; createdAt?: Date },
  user: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  },
  serverBaseUrl: string,
) => {
  const { storeId, storePassword } = getSslcommerzCredentials();
  const transactionId = order.transactionId;

  if (!transactionId) {
    throw new AppError(500, 'Order transaction id is missing');
  }

  const totalQuantity = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const productNames = order.items
    .map((item) => item.productName)
    .join(',')
    .slice(0, 255);
  const customerAddress = order.shippingAddress || user.address || 'Dhaka';
  const customerCity = user.city || 'Dhaka';
  const customerPostcode = user.postalCode || '1000';

  const params = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: order.totalPrice.toFixed(2),
    currency: 'BDT',
    tran_id: transactionId,
    success_url: `${serverBaseUrl}/api/v1/orders/payment/success`,
    fail_url: `${serverBaseUrl}/api/v1/orders/payment/fail`,
    cancel_url: `${serverBaseUrl}/api/v1/orders/payment/cancel`,
    ipn_url: `${serverBaseUrl}/api/v1/orders/payment/ipn`,
    cus_name: user.name,
    cus_email: user.email,
    cus_add1: customerAddress,
    cus_city: customerCity,
    cus_state: customerCity,
    cus_postcode: customerPostcode,
    cus_country: 'Bangladesh',
    cus_phone: order.contactPhone || user.phone || '01700000000',
    shipping_method: 'YES',
    num_of_item: String(totalQuantity),
    ship_name: user.name,
    ship_add1: order.shippingAddress,
    ship_city: customerCity,
    ship_state: customerCity,
    ship_postcode: customerPostcode,
    ship_country: 'Bangladesh',
    product_name: productNames || 'Artisane order',
    product_category: 'art',
    product_profile: 'physical-goods',
    product_amount: order.totalPrice.toFixed(2),
    vat: '0',
    discount_amount: '0',
    convenience_fee: '0',
    value_a: order._id.toString(),
  });

  const gateway = PAYMENT_METHOD_GATEWAYS[order.paymentMethod || ''];

  if (gateway) {
    params.set('multi_card_name', gateway);
  }

  const response = await fetch(`${SSLCOMMERZ_BASE_URL}/gwprocess/v4/api.php`, {
    method: 'POST',
    body: params,
  });

  if (!response.ok) {
    throw new AppError(502, 'Failed to connect with SSLCommerz');
  }

  const sessionData = (await response.json()) as TSslcommerzSessionResponse;

  if (sessionData.status !== 'SUCCESS') {
    throw new AppError(
      400,
      sessionData.failedreason || 'SSLCommerz payment session failed',
    );
  }

  const paymentUrl = getPaymentRedirectUrl(
    sessionData,
    order.paymentMethod || PAYMENT_METHOD.sslcommerz,
  );

  if (!paymentUrl) {
    throw new AppError(400, 'SSLCommerz did not return a payment URL');
  }

  await Order.findByIdAndUpdate(order._id, {
    sslcommerzSessionKey: sessionData.sessionkey,
  });

  return {
    sessionKey: sessionData.sessionkey,
    paymentUrl,
    gatewayPageUrl: sessionData.GatewayPageURL,
  };
};

const validateSslcommerzPayment = async (valId: string) => {
  const { storeId, storePassword } = getSslcommerzCredentials();
  const params = new URLSearchParams({
    val_id: valId,
    store_id: storeId,
    store_passwd: storePassword,
    v: '1',
    format: 'json',
  });

  const response = await fetch(
    `${SSLCOMMERZ_BASE_URL}/validator/api/validationserverAPI.php?${params.toString()}`,
  );

  if (!response.ok) {
    throw new AppError(502, 'Failed to validate SSLCommerz payment');
  }

  return (await response.json()) as TSslcommerzValidationResponse;
};

const restoreOrderStock = async (items: IOrderItem[]) => {
  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product || product.isDeleted) {
      continue;
    }

    product.stock += item.quantity;
    await product.save();
  }
};

const normalizeBangladeshPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }

  if (digits.length === 13 && digits.startsWith('8801')) {
    return `0${digits.slice(3)}`;
  }

  if (digits.length === 10 && digits.startsWith('1')) {
    return `0${digits}`;
  }

  throw new AppError(
    400,
    'Steadfast recipient phone must be a valid Bangladesh 11 digit number',
  );
};

const getOrderItemDescription = (order: IOrder) => {
  return order.items
    .map((item) => `${item.productName} x ${item.quantity}`)
    .join(', ')
    .slice(0, 250);
};

const FRAUD_LOOKBACK_24H_MS = 24 * 60 * 60 * 1000;
const FRAUD_LOOKBACK_1H_MS = 60 * 60 * 1000;

const assessFraudRisk = async (
  userId: string,
  contactPhone: string,
  shippingAddress: string,
  paymentMethod: string,
  totalPrice: number,
) => {
  const since24h = new Date(Date.now() - FRAUD_LOOKBACK_24H_MS);
  const since1h = new Date(Date.now() - FRAUD_LOOKBACK_1H_MS);

  const [phoneOrders24h, userOpenOrders1h, addressOrders24h] =
    await Promise.all([
      Order.countDocuments({
        contactPhone,
        createdAt: { $gte: since24h },
        isDeleted: false,
      }),
      Order.countDocuments({
        createdAt: { $gte: since1h },
        isDeleted: false,
        orderStatus: {
          $in: [
            ORDER_STATUS.confirmed,
            ORDER_STATUS.pending,
            ORDER_STATUS.processing,
          ],
        },
        user: userId,
      }),
      Order.countDocuments({
        createdAt: { $gte: since24h },
        isDeleted: false,
        shippingAddress,
      }),
    ]);

  const fraudFlags: string[] = [];

  if (phoneOrders24h >= 3) {
    fraudFlags.push('Repeated orders from same phone within 24 hours');
  }

  if (userOpenOrders1h >= 2) {
    fraudFlags.push('Multiple open orders from same account within 1 hour');
  }

  if (addressOrders24h >= 5) {
    fraudFlags.push('Many orders sent to same address within 24 hours');
  }

  if (paymentMethod === PAYMENT_METHOD.cod && totalPrice >= 15000) {
    fraudFlags.push('High value COD order');
  }

  return {
    fraudCheckedAt: new Date(),
    fraudFlags,
    fraudRisk:
      fraudFlags.length >= 3
        ? ('high' as const)
        : fraudFlags.length > 0
          ? ('medium' as const)
          : ('low' as const),
  };
};

const getCodDeliveredPaymentUpdate = (order: IOrder, now: Date) => {
  if (
    order.paymentMethod === PAYMENT_METHOD.cod &&
    order.orderStatus === ORDER_STATUS.delivered &&
    order.paymentStatus !== PAYMENT_STATUS.paid
  ) {
    return {
      paidAt: order.paidAt || now,
      paymentStatus: PAYMENT_STATUS.paid,
    };
  }

  return {};
};

const createOrderIntoDB = async (
  userId: string,
  payload: ICreateOrderPayload,
  serverBaseUrl: string,
  activityContext?: IActivityLogContext,
) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const orderItems: IOrderItem[] = [];
  let totalPrice = 0;

  for (const item of payload.items) {
    const product = await Product.findOne({
      _id: item.product,
      isDeleted: false,
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    if (product.stock < item.quantity) {
      throw new AppError(400, `Insufficient stock for ${product.name}`);
    }

    const activePromo = await PromoBanner.findOne({ isActive: true }).sort({
      updatedAt: -1,
    });
    const isPromoActive =
      activePromo &&
      activePromo.discountPercent > 0 &&
      new Date(activePromo.endsAt).getTime() > Date.now();
    const discountPercent = isPromoActive
      ? Math.min(Math.max(activePromo.discountPercent, 0), 100)
      : 0;
    const discountAmount = Math.round((product.price * discountPercent) / 100);
    const unitPrice = Math.max(0, product.price - discountAmount);

    const subtotal = unitPrice * item.quantity;

    orderItems.push({
      product: product._id,
      productName: product.name,
      productSlug: product.slug,
      ...(product.images?.[0] ? { image: product.images[0] } : {}),
      quantity: item.quantity,
      unitPrice,
      subtotal,
    });

    totalPrice += subtotal;
  }

  const fraudCheck = await assessFraudRisk(
    userId,
    payload.contactPhone,
    payload.shippingAddress,
    payload.paymentMethod,
    totalPrice,
  );

  for (const item of payload.items) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    product.stock -= item.quantity;
    await product.save();
  }

  const orderPayload: IOrder = {
    user: user._id,
    items: orderItems,
    totalPrice,
    ...fraudCheck,
    shippingAddress: payload.shippingAddress,
    contactPhone: payload.contactPhone,
    paymentMethod: payload.paymentMethod,
    transactionId: generateTransactionId(),
    orderStatus: ORDER_STATUS.confirmed,
    ...(payload.notes ? { notes: payload.notes } : {}),
  };

  const createdOrder = await Order.create(orderPayload);
  const result = await populateOrder(Order.findById(createdOrder._id));

  await createPaymentLog({
    orderId: createdOrder._id,
    userId: user._id,
    transactionId: createdOrder.transactionId!,
    amount: createdOrder.totalPrice,
    paymentMethod: createdOrder.paymentMethod!,
    status:
      createdOrder.paymentStatus === PAYMENT_STATUS.paid ? 'Paid' : 'Pending',
    gatewayResponse: {
      event: 'ORDER_CREATED',
      orderStatus: createdOrder.orderStatus,
      paymentMethod: createdOrder.paymentMethod,
    },
  });

  await ActivityLogServices.recordActivity({
    ...activityContext,
    action: 'order.created',
    actorId: userId,
    actorRole: activityContext?.actorRole ?? 'user',
    metadata: {
      itemCount: createdOrder.items.length,
      paymentMethod: createdOrder.paymentMethod,
      totalPrice: createdOrder.totalPrice,
    },
    module: 'orders',
    severity: createdOrder.fraudRisk === 'high' ? 'high' : 'low',
    source: activityContext?.source ?? 'user',
    status: 'success',
    summary: `Order ${getOrderLogLabel(createdOrder)} was created`,
    targetId: createdOrder._id.toString(),
    targetLabel: getOrderLogLabel(createdOrder),
    targetType: 'order',
  });

  if (
    result &&
    ONLINE_PAYMENT_METHODS.has(payload.paymentMethod) &&
    payload.paymentMethod !== PAYMENT_METHOD.cod
  ) {
    const payment = await initiateSslcommerzPayment(
      createdOrder,
      user,
      serverBaseUrl,
    );

    return {
      order: result,
      payment,
    };
  }

  return {
    order: result,
    payment: null,
  };
};

const createShipmentIntoDB = async (
  id: string,
  payload: ICreateShipmentPayload,
  activityContext?: IActivityLogContext,
) => {
  const order = await Order.findOne({ _id: id, isDeleted: false });

  if (!order) {
    return null;
  }

  if (order.orderStatus === ORDER_STATUS.cancelled) {
    throw new AppError(400, 'Cancelled order cannot create shipment');
  }

  if (order.orderStatus === ORDER_STATUS.delivered) {
    throw new AppError(400, 'Delivered order cannot create shipment');
  }

  if (
    order.orderStatus &&
    order.orderStatus !== ORDER_STATUS.confirmed &&
    order.orderStatus !== ORDER_STATUS.processing
  ) {
    throw new AppError(
      400,
      `Shipment can be created only for confirmed or processing orders`,
    );
  }

  if (order.courierProvider || order.courierOrderId || order.trackingCode) {
    throw new AppError(400, 'Shipment already exists for this order');
  }

  if (
    order.paymentMethod !== PAYMENT_METHOD.cod &&
    order.paymentStatus !== PAYMENT_STATUS.paid
  ) {
    throw new AppError(
      400,
      'Paid payment is required before shipment dispatch',
    );
  }

  const user = await User.findOne({ _id: order.user, isDeleted: false });

  if (!user) {
    throw new AppError(404, 'Order user not found');
  }

  const recipientPhone = normalizeBangladeshPhone(order.contactPhone);
  const shipment = await ShippingServices.createSteadfastOrder({
    invoice: order.transactionId || order._id.toString(),
    recipient_name: user.name.slice(0, 100),
    recipient_phone: recipientPhone,
    recipient_address: order.shippingAddress.slice(0, 250),
    cod_amount:
      order.paymentStatus === PAYMENT_STATUS.paid ? 0 : order.totalPrice,
    item_description: payload.itemDescription || getOrderItemDescription(order),
    ...(payload.alternativePhone
      ? {
          alternative_phone: normalizeBangladeshPhone(payload.alternativePhone),
        }
      : {}),
    ...(payload.deliveryType !== undefined
      ? { delivery_type: payload.deliveryType }
      : {}),
    ...(payload.note ? { note: payload.note } : {}),
    ...(payload.recipientEmail
      ? { recipient_email: payload.recipientEmail }
      : {}),
    ...(payload.totalLot !== undefined ? { total_lot: payload.totalLot } : {}),
  });
  const now = new Date();

  const result = await populateOrder(
    Order.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        courierOrderId: shipment.consignmentId,
        courierProvider: 'steadfast',
        courierStatus: shipment.courierStatus,
        courierStatusRaw: shipment.raw,
        orderStatus: ORDER_STATUS.processing,
        shipmentCreatedAt: now,
        trackingCode: shipment.trackingCode,
        trackingUrl: shipment.trackingUrl,
      },
      { returnDocument: 'after', runValidators: true },
    ),
  );

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'shipment.created',
      changes: ActivityLogServices.buildActivityChanges(order, result, [
        'courierOrderId',
        'courierProvider',
        'courierStatus',
        'orderStatus',
        'shipmentCreatedAt',
        'trackingCode',
        'trackingUrl',
      ]),
      metadata: { courierProvider: result.courierProvider },
      module: 'shipping',
      severity: 'low',
      status: 'success',
      summary: `Shipment was created for order ${getOrderLogLabel(result)}`,
      targetId: getOrderLogTargetId(result, id),
      targetLabel: getOrderLogLabel(result, id),
      targetType: 'order',
    });
  }

  return result;
};

const syncShipmentIntoDB = async (
  id: string,
  activityContext?: IActivityLogContext,
) => {
  const order = await Order.findOne({ _id: id, isDeleted: false });

  if (!order) {
    return null;
  }

  if (!order.courierProvider || !order.trackingCode) {
    throw new AppError(400, 'Shipment is not created for this order');
  }

  if (
    order.orderStatus === ORDER_STATUS.cancelled ||
    order.orderStatus === ORDER_STATUS.delivered
  ) {
    throw new AppError(
      400,
      `Order cannot sync when status is ${order.orderStatus}`,
    );
  }

  const shipmentStatus = await ShippingServices.getShipmentStatus(order);
  const mappedOrderStatus = ShippingServices.mapCourierStatusToOrderStatus(
    shipmentStatus.courierStatus,
  );
  const now = new Date();
  const update: Record<string, unknown> = {
    courierStatus: shipmentStatus.courierStatus,
    courierStatusRaw: shipmentStatus.courierStatusRaw,
    lastCourierSyncAt: now,
  };

  if (mappedOrderStatus) {
    update.orderStatus = mappedOrderStatus;
    const nextOrder = {
      ...order.toObject(),
      orderStatus: mappedOrderStatus,
    } as IOrder;

    if (mappedOrderStatus === ORDER_STATUS.shipped && !order.shippedAt) {
      update.shippedAt = now;
    }

    if (mappedOrderStatus === ORDER_STATUS.delivered) {
      update.deliveredAt = order.deliveredAt || now;
      update.shippedAt = order.shippedAt || now;
    }

    Object.assign(update, getCodDeliveredPaymentUpdate(nextOrder, now));
  }

  const result = await populateOrder(
    Order.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
      returnDocument: 'after',
      runValidators: true,
    }),
  );

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'shipment.synced',
      changes: ActivityLogServices.buildActivityChanges(order, result, [
        'courierStatus',
        'orderStatus',
        'lastCourierSyncAt',
        'shippedAt',
        'deliveredAt',
        'paymentStatus',
        'paidAt',
      ]),
      metadata: { courierProvider: result.courierProvider },
      module: 'shipping',
      severity: 'low',
      source: activityContext?.source ?? 'admin',
      status: 'success',
      summary: `Shipment status synced for order ${getOrderLogLabel(result)}`,
      targetId: getOrderLogTargetId(result, id),
      targetLabel: getOrderLogLabel(result, id),
      targetType: 'order',
    });
  }

  return result;
};

const syncPendingShipmentsIntoDB = async () => {
  const orders = await Order.find({
    courierProvider: { $exists: true },
    isDeleted: false,
    orderStatus: { $nin: [ORDER_STATUS.cancelled, ORDER_STATUS.delivered] },
    trackingCode: { $exists: true },
  }).limit(25);

  let failed = 0;
  let synced = 0;

  for (const order of orders) {
    try {
      const result = await syncShipmentIntoDB(order._id.toString(), {
        actorRole: 'system',
        source: 'scheduler',
      });

      if (result) {
        synced += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    failed,
    scanned: orders.length,
    synced,
  };
};

const getMyOrdersFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Order.countDocuments({ user: userId, isDeleted: false }),
    populateOrder(
      Order.find({ user: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getAllOrdersFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Order.countDocuments({ isDeleted: false }),
    populateOrder(
      Order.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getSingleOrderFromDB = async (id: string, userId?: string) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const filter: Record<string, unknown> = {
    isDeleted: false,
    ...(isObjectId
      ? { $or: [{ _id: id }, { publicRef: id }, { transactionId: id }] }
      : { $or: [{ publicRef: id }, { transactionId: id }] }),
  };
  if (userId) {
    filter.user = userId;
  }

  const result = await populateOrder(Order.findOne(filter));

  return result;
};

const updateOrderStatusIntoDB = async (
  id: string,
  payload: Partial<Pick<IOrder, 'orderStatus' | 'paymentStatus'>>,
  activityContext?: IActivityLogContext,
) => {
  const order = await Order.findOne({ _id: id, isDeleted: false });

  if (!order) {
    return null;
  }

  if (payload.orderStatus) {
    if (payload.orderStatus === ORDER_STATUS.cancelled) {
      throw new AppError(400, 'Use the cancel order route to cancel an order');
    }

    const currentStatus = order.orderStatus || ORDER_STATUS.pending;
    const allowedTransitions = [
      ...ORDER_STATUS_TRANSITIONS[currentStatus],
    ] as string[];

    if (!allowedTransitions.includes(payload.orderStatus)) {
      throw new AppError(
        400,
        `Invalid order status transition from ${currentStatus} to ${payload.orderStatus}`,
      );
    }
  }

  const now = new Date();
  const update: Record<string, unknown> = { ...payload };
  const nextOrder = {
    ...order.toObject(),
    ...payload,
  } as IOrder;

  if (payload.orderStatus === ORDER_STATUS.delivered) {
    update.deliveredAt = order.deliveredAt || now;
    update.shippedAt = order.shippedAt || now;
  }

  Object.assign(update, getCodDeliveredPaymentUpdate(nextOrder, now));

  const result = await populateOrder(
    Order.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
      returnDocument: 'after',
      runValidators: true,
    }),
  );

  if (
    result &&
    payload.paymentStatus === PAYMENT_STATUS.paid &&
    order.paymentStatus !== PAYMENT_STATUS.paid
  ) {
    await createPaymentLog({
      orderId: order._id,
      userId: result.user!,
      transactionId: result.transactionId!,
      amount: result.totalPrice,
      paymentMethod: result.paymentMethod!,
      status: 'Paid',
      gatewayResponse: {
        event: 'ORDER_STATUS_UPDATED',
        orderStatus: result.orderStatus,
        paymentStatus: result.paymentStatus,
      },
    });
  }

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'order.status_updated',
      changes: ActivityLogServices.buildActivityChanges(order, result, [
        'orderStatus',
        'paymentStatus',
        'paidAt',
        'shippedAt',
        'deliveredAt',
      ]),
      module: 'orders',
      severity: 'medium',
      status: 'success',
      summary: `Order ${getOrderLogLabel(result)} status was updated`,
      targetId: getOrderLogTargetId(result, id),
      targetLabel: getOrderLogLabel(result, id),
      targetType: 'order',
    });
  }

  return result;
};

const cancelOrderIntoDB = async (
  id: string,
  userId: string,
  userRole: string,
  activityContext?: IActivityLogContext,
) => {
  const order = await Order.findOne({ _id: id, isDeleted: false });

  if (!order) {
    return null;
  }

  if (userRole !== 'admin' && order.user.toString() !== userId) {
    throw new AppError(403, 'You are not allowed to cancel this order');
  }

  const currentStatus = order.orderStatus || ORDER_STATUS.pending;

  if (
    !(CANCELLABLE_ORDER_STATUSES as readonly string[]).includes(currentStatus)
  ) {
    throw new AppError(
      400,
      `Order cannot be cancelled when status is ${currentStatus}`,
    );
  }

  await restoreOrderStock(order.items);

  const nextPaymentStatus =
    order.paymentStatus === PAYMENT_STATUS.paid
      ? PAYMENT_STATUS.refunded
      : order.paymentStatus;

  const result = await populateOrder(
    Order.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        orderStatus: ORDER_STATUS.cancelled,
        paymentStatus: nextPaymentStatus,
      },
      { returnDocument: 'after', runValidators: true },
    ),
  );

  if (result) {
    await createPaymentLog({
      orderId: order._id,
      userId: result.user!,
      transactionId: result.transactionId!,
      amount: result.totalPrice,
      paymentMethod: result.paymentMethod!,
      status:
        nextPaymentStatus === PAYMENT_STATUS.refunded ? 'Refunded' : 'Failed',
      errorMessage: 'Order cancelled by user/admin',
      gatewayResponse: {
        event: 'ORDER_CANCELLED',
        previousPaymentStatus: order.paymentStatus,
        newPaymentStatus: nextPaymentStatus,
      },
    });
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'order.cancelled',
      actorId: userId,
      actorRole: userRole === 'admin' ? 'admin' : 'user',
      changes: ActivityLogServices.buildActivityChanges(order, result, [
        'orderStatus',
        'paymentStatus',
      ]),
      module: 'orders',
      severity: 'medium',
      source: activityContext?.source ?? (userRole === 'admin' ? 'admin' : 'user'),
      status: 'success',
      summary: `Order ${getOrderLogLabel(result)} was cancelled`,
      targetId: getOrderLogTargetId(result, id),
      targetLabel: getOrderLogLabel(result, id),
      targetType: 'order',
    });
  }

  return result;
};

const getPaymentPayloadValue = (
  payload: Record<string, unknown>,
  key: string,
) => {
  const value = payload[key];

  return typeof value === 'string' ? value : '';
};

const getCourierPayloadRecord = (payload: Record<string, unknown>) => {
  const data = payload.data;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return payload;
};

const getCourierPayloadValue = (
  payload: Record<string, unknown>,
  key: string,
) => {
  const record = getCourierPayloadRecord(payload);
  const value = record[key] ?? payload[key];

  return value === undefined || value === null ? '' : String(value);
};

const getSteadfastWebhookStatus = (payload: Record<string, unknown>) => {
  const record = getCourierPayloadRecord(payload);

  return (
    record.delivery_status ??
    record.consignment_status ??
    record.current_status ??
    record.status ??
    payload.delivery_status ??
    payload.consignment_status ??
    payload.current_status ??
    payload.status
  );
};

const handleSteadfastWebhook = async (
  payload: Record<string, unknown>,
  activityContext?: IActivityLogContext,
) => {
  const consignmentId = getCourierPayloadValue(payload, 'consignment_id');
  const invoice = getCourierPayloadValue(payload, 'invoice');

  if (!consignmentId && !invoice) {
    throw new AppError(400, 'Steadfast consignment_id or invoice is required');
  }

  const order = await Order.findOne({
    isDeleted: false,
    ...(consignmentId
      ? { courierOrderId: consignmentId }
      : { transactionId: invoice }),
  });

  if (!order) {
    throw new AppError(404, 'Order not found for Steadfast webhook');
  }

  const courierStatus = ShippingServices.normalizeCourierStatus(
    getSteadfastWebhookStatus(payload),
  );
  const mappedOrderStatus =
    ShippingServices.mapCourierStatusToOrderStatus(courierStatus);
  const now = new Date();
  const update: Record<string, unknown> = {
    courierStatus,
    courierStatusRaw: payload,
    lastCourierSyncAt: now,
  };

  if (mappedOrderStatus) {
    update.orderStatus = mappedOrderStatus;
    const nextOrder = {
      ...order.toObject(),
      orderStatus: mappedOrderStatus,
    } as IOrder;

    if (mappedOrderStatus === ORDER_STATUS.shipped && !order.shippedAt) {
      update.shippedAt = now;
    }

    if (mappedOrderStatus === ORDER_STATUS.delivered) {
      update.deliveredAt = order.deliveredAt || now;
      update.shippedAt = order.shippedAt || now;
    }

    Object.assign(update, getCodDeliveredPaymentUpdate(nextOrder, now));
  }

  const result = await populateOrder(
    Order.findOneAndUpdate({ _id: order._id, isDeleted: false }, update, {
      returnDocument: 'after',
      runValidators: true,
    }),
  );

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'shipment.webhook_received',
      actorRole: 'system',
      changes: ActivityLogServices.buildActivityChanges(order, result, [
        'courierStatus',
        'orderStatus',
        'lastCourierSyncAt',
        'shippedAt',
        'deliveredAt',
        'paymentStatus',
        'paidAt',
      ]),
      metadata: { courierProvider: 'steadfast' },
      module: 'shipping',
      severity: 'low',
      source: activityContext?.source ?? 'courier_webhook',
      status: 'success',
      summary: `Steadfast webhook updated order ${getOrderLogLabel(result)}`,
      targetId: getOrderLogTargetId(result, order._id?.toString()),
      targetLabel: getOrderLogLabel(result),
      targetType: 'order',
    });
  }

  return result;
};

const markOrderAsPaid = async (
  payload: Record<string, unknown>,
  activityContext?: IActivityLogContext,
) => {
  const valId = getPaymentPayloadValue(payload, 'val_id');

  if (!valId) {
    throw new AppError(400, 'SSLCommerz validation id is required');
  }

  const validation = await validateSslcommerzPayment(valId);

  if (!['VALID', 'VALIDATED'].includes(validation.status || '')) {
    throw new AppError(400, 'Invalid SSLCommerz transaction');
  }

  if (!validation.tran_id) {
    throw new AppError(400, 'SSLCommerz transaction id is missing');
  }

  const order = await Order.findOne({
    transactionId: validation.tran_id,
    isDeleted: false,
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  const paidAmount = Number(validation.amount);

  if (
    Number.isNaN(paidAmount) ||
    Math.abs(paidAmount - order.totalPrice) > 0.01 ||
    validation.currency !== 'BDT'
  ) {
    throw new AppError(400, 'SSLCommerz amount validation failed');
  }

  const result = await populateOrder(
    Order.findOneAndUpdate(
      { _id: order._id, isDeleted: false },
      {
        paymentStatus: PAYMENT_STATUS.paid,
        orderStatus:
          order.orderStatus === ORDER_STATUS.pending
            ? ORDER_STATUS.confirmed
            : order.orderStatus,
        sslcommerzValidationId: validation.val_id,
        bankTransactionId: validation.bank_tran_id,
        cardType: validation.card_type,
        paidAt: order.paidAt || new Date(),
      },
      { returnDocument: 'after', runValidators: true },
    ),
  );

  await createPaymentLog({
    orderId: order._id,
    userId: order.user,
    transactionId: order.transactionId!,
    amount: order.totalPrice,
    paymentMethod: order.paymentMethod!,
    status: 'Paid',
    gatewayResponse: validation,
  });

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'payment.paid',
      actorRole: 'system',
      changes: ActivityLogServices.buildActivityChanges(order, result, [
        'paymentStatus',
        'orderStatus',
        'sslcommerzValidationId',
        'bankTransactionId',
        'cardType',
        'paidAt',
      ]),
      metadata: {
        amount: order.totalPrice,
        transactionId: order.transactionId,
      },
      module: 'payments',
      severity: 'low',
      source: activityContext?.source ?? 'payment_gateway',
      status: 'success',
      summary: `Payment was marked paid for order ${getOrderLogLabel(order)}`,
      targetId: getOrderLogTargetId(order),
      targetLabel: getOrderLogLabel(order),
      targetType: 'order',
    });
  }

  return {
    order: result,
    validation,
  };
};

const markOrderPaymentFailed = async (
  payload: Record<string, unknown>,
  activityContext?: IActivityLogContext,
) => {
  const transactionId = getPaymentPayloadValue(payload, 'tran_id');

  if (!transactionId) {
    throw new AppError(400, 'SSLCommerz transaction id is required');
  }

  const order = await Order.findOne({
    transactionId,
    isDeleted: false,
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  await createPaymentLog({
    orderId: order._id,
    userId: order.user,
    transactionId: order.transactionId!,
    amount: order.totalPrice,
    paymentMethod: order.paymentMethod!,
    status: 'Failed',
    errorMessage:
      getPaymentPayloadValue(payload, 'error') ||
      'Payment failed or cancelled via gateway',
    gatewayResponse: payload,
  });

  if (
    order.orderStatus &&
    (CANCELLABLE_ORDER_STATUSES as readonly string[]).includes(
      order.orderStatus,
    )
  ) {
    await restoreOrderStock(order.items);
  }

  const result = await populateOrder(
    Order.findOneAndUpdate(
      { _id: order._id, isDeleted: false },
      {
        orderStatus: ORDER_STATUS.cancelled,
        paymentStatus: PAYMENT_STATUS.failed,
      },
      { returnDocument: 'after', runValidators: true },
    ),
  );

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'payment.failed',
      actorRole: 'system',
      changes: ActivityLogServices.buildActivityChanges(order, result, [
        'orderStatus',
        'paymentStatus',
      ]),
      metadata: {
        transactionId: order.transactionId,
      },
      module: 'payments',
      severity: 'medium',
      source: activityContext?.source ?? 'payment_gateway',
      status: 'failed',
      summary: `Payment failed for order ${getOrderLogLabel(order)}`,
      targetId: getOrderLogTargetId(order),
      targetLabel: getOrderLogLabel(order),
      targetType: 'order',
    });
  }

  return result;
};

const handleSslcommerzIpn = async (
  payload: Record<string, unknown>,
  activityContext?: IActivityLogContext,
) => {
  const status = getPaymentPayloadValue(payload, 'status');

  if (['VALID', 'VALIDATED'].includes(status)) {
    return markOrderAsPaid(payload, activityContext);
  }

  if (['FAILED', 'CANCELLED'].includes(status)) {
    return {
      order: await markOrderPaymentFailed(payload, activityContext),
      validation: null,
    };
  }

  throw new AppError(400, 'Unsupported SSLCommerz payment status');
};

const deleteSingleOrderFromDB = async (
  id: string,
  activityContext?: IActivityLogContext,
) => {
  const result = await populateOrder(
    Order.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { returnDocument: 'after' },
    ),
  );

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'order.deleted',
      changes: [{ after: true, before: false, field: 'isDeleted' }],
      module: 'orders',
      severity: 'medium',
      status: 'success',
      summary: `Order ${getOrderLogLabel(result)} was deleted`,
      targetId: getOrderLogTargetId(result, id),
      targetLabel: getOrderLogLabel(result, id),
      targetType: 'order',
    });
  }

  return result;
};

export const OrderServices = {
  createOrderIntoDB,
  createShipmentIntoDB,
  syncShipmentIntoDB,
  syncPendingShipmentsIntoDB,
  getMyOrdersFromDB,
  getAllOrdersFromDB,
  getSingleOrderFromDB,
  updateOrderStatusIntoDB,
  cancelOrderIntoDB,
  markOrderAsPaid,
  markOrderPaymentFailed,
  handleSslcommerzIpn,
  handleSteadfastWebhook,
  deleteSingleOrderFromDB,
};
