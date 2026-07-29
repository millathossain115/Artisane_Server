import nodemailer from 'nodemailer';
import config from '../config/index.js';
import AppError from '../errors/appError.js';
import type { IUser } from '../modules/user/user.interface.js';
import type {
  IOrder,
  IOrderItem,
  TOrderStatus,
  TPaymentMethod,
  TPaymentStatus,
} from '../modules/order/order.interface.js';

type TInvoiceUser = Pick<IUser, 'email' | 'name'>;
type TInvoiceOrder = Partial<
  Omit<
    IOrder,
    'items' | 'orderStatus' | 'paymentMethod' | 'paymentStatus' | 'user'
  >
> & {
  _id?: { toString: () => string } | string;
  createdAt?: Date | string;
  items?: TInvoiceItem[];
  orderStatus?: TOrderStatus;
  paymentMethod?: TPaymentMethod;
  paymentStatus?: TPaymentStatus;
  user?: TInvoiceUser | { toString: () => string } | string | null;
};

type TInvoiceItem = Partial<IOrderItem> & {
  price?: number;
};

type TPdfTextLine = {
  color?: string;
  font?: 'bold' | 'regular';
  size?: number;
  text: string;
  x: number;
  y: number;
};

const getTransporter = () => {
  const { from, host, pass, port, user } = config.smtp;

  if (!host || !user || !pass || !from) {
    throw new AppError(500, 'SMTP email credentials are not configured');
  }

  return nodemailer.createTransport({
    auth: {
      pass,
      user,
    },
    host,
    port,
    secure: port === 465,
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizePdfText = (value: string) =>
  value
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const drawText = ({
  color = '0.09 0.08 0.07',
  font = 'regular',
  size = 10,
  text,
  x,
  y,
}: TPdfTextLine) =>
  `BT ${color} rg /${font === 'bold' ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${sanitizePdfText(text)}) Tj ET`;

const drawFilledRect = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) => `${color} rg ${x} ${y} ${width} ${height} re f`;

const drawRightText = ({
  color,
  font,
  size = 10,
  text,
  x,
  y,
}: TPdfTextLine) => {
  const width = text.length * size * 0.52;
  const textLine: TPdfTextLine = { size, text, x: x - width, y };

  if (color) {
    textLine.color = color;
  }

  if (font) {
    textLine.font = font;
  }

  return drawText(textLine);
};

const formatPrice = (value?: number) => {
  const safeValue =
    typeof value === 'number' && !Number.isNaN(value) ? value : 0;

  return `$${safeValue.toFixed(safeValue % 1 === 0 ? 0 : 2)}`;
};

const formatLabel = (value?: string) =>
  value
    ? value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Not set';

const formatInvoiceDate = (value?: Date | string) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const truncateText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const getOrderId = (order: TInvoiceOrder) => order._id?.toString() ?? 'order';

const getOrderRef = (order: TInvoiceOrder) =>
  order.transactionId || getOrderId(order);

const getInvoiceFileName = (order: TInvoiceOrder) =>
  `artisane-invoice-${getOrderRef(order).replace(/[^a-z0-9-]/gi, '-')}.pdf`;

const getInvoiceUser = (order: TInvoiceOrder): TInvoiceUser => {
  if (isRecord(order.user)) {
    return {
      email: typeof order.user.email === 'string' ? order.user.email : '',
      name: typeof order.user.name === 'string' ? order.user.name : '',
    };
  }

  return { email: '', name: '' };
};

const getUnitPrice = (item: TInvoiceItem) => item.unitPrice ?? item.price ?? 0;

const getLineSubtotal = (item: TInvoiceItem) =>
  item.subtotal ?? getUnitPrice(item) * (item.quantity ?? 1);

const getInvoiceSubtotal = (order: TInvoiceOrder) =>
  order.items?.reduce((total, item) => total + getLineSubtotal(item), 0) ?? 0;

const getInvoiceTotal = (order: TInvoiceOrder) =>
  order.totalPrice ?? getInvoiceSubtotal(order);

const buildInvoiceHtml = (order: TInvoiceOrder) => {
  const user = getInvoiceUser(order);
  const items = order.items ?? [];
  const itemRows = items
    .map((item) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = item.unitPrice ?? 0;
      const subtotal = getLineSubtotal(item);

      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e2d8ca;">${escapeHtml(item.productName || 'Product')}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2d8ca;text-align:center;">${quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2d8ca;text-align:right;">${formatPrice(unitPrice)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2d8ca;text-align:right;font-weight:700;">${formatPrice(subtotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #181512; background:#f6f0e5; padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;padding:24px;border:1px solid #e2d8ca;">
        <h2 style="margin:0 0 6px;">Artisane invoice</h2>
        <p style="margin:0 0 20px;color:#6b5f53;">Order ${escapeHtml(getOrderRef(order))}</p>
        <p>Hello ${escapeHtml(user.name || 'there')},</p>
        <p>Thank you for your order. Your invoice PDF is attached, and your order summary is below.</p>

        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#181512;color:#ffffff;">
              <th style="padding:10px 8px;text-align:left;">Product</th>
              <th style="padding:10px 8px;text-align:center;">Qty</th>
              <th style="padding:10px 8px;text-align:right;">Price</th>
              <th style="padding:10px 8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="text-align:right;font-size:18px;font-weight:700;margin:16px 0;">
          Grand total: ${formatPrice(getInvoiceTotal(order))}
        </div>

        <div style="background:#f6f0e5;padding:16px;margin-top:20px;">
          <p style="margin:0;"><strong>Payment:</strong> ${escapeHtml(formatLabel(order.paymentMethod))} (${escapeHtml(formatLabel(order.paymentStatus))})</p>
          <p style="margin:6px 0 0;"><strong>Order status:</strong> ${escapeHtml(formatLabel(order.orderStatus))}</p>
          <p style="margin:6px 0 0;"><strong>Phone:</strong> ${escapeHtml(order.contactPhone || 'Not set')}</p>
          <p style="margin:6px 0 0;"><strong>Address:</strong> ${escapeHtml(order.shippingAddress || 'Not set')}</p>
        </div>

        <p style="margin-top:24px;">Thank you for shopping with Artisane.</p>
      </div>
    </div>
  `;
};

const buildInvoiceText = (order: TInvoiceOrder) => {
  const user = getInvoiceUser(order);
  const items = order.items ?? [];
  const lines = [
    `Artisane invoice`,
    `Order: ${getOrderRef(order)}`,
    `Customer: ${user.name || 'Customer'}`,
    `Email: ${user.email}`,
    `Phone: ${order.contactPhone || 'Not set'}`,
    `Address: ${order.shippingAddress || 'Not set'}`,
    '',
    'Items:',
    ...items.map(
      (item) =>
        `${item.productName || 'Product'} x ${item.quantity ?? 1} - ${formatPrice(getLineSubtotal(item))}`,
    ),
    '',
    `Total: ${formatPrice(getInvoiceTotal(order))}`,
    `Payment: ${formatLabel(order.paymentMethod)} (${formatLabel(order.paymentStatus)})`,
    `Order status: ${formatLabel(order.orderStatus)}`,
  ];

  return lines.join('\n');
};

const buildInvoicePdf = (order: TInvoiceOrder) => {
  const user = getInvoiceUser(order);
  const items = order.items ?? [];
  const orderRef = getOrderRef(order);
  const subtotal = getInvoiceSubtotal(order);
  const total = getInvoiceTotal(order);
  const visibleItems = items.slice(0, 14);
  const lines: string[] = [
    drawFilledRect(0, 0, 595, 842, '1 1 1'),
    drawFilledRect(48, 760, 38, 38, '0.09 0.08 0.07'),
    drawText({
      color: '1 1 1',
      font: 'bold',
      size: 25,
      text: 'A',
      x: 59,
      y: 770,
    }),
    drawText({
      font: 'bold',
      size: 25,
      text: 'Artisane',
      x: 98,
      y: 775,
    }),
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: 'Curated craft supplies and studio goods',
      x: 100,
      y: 760,
    }),
    drawText({
      color: '0.72 0.43 0.30',
      size: 24,
      text: 'INVOICE',
      x: 430,
      y: 775,
    }),
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: `# ${orderRef}`,
      x: 400,
      y: 755,
    }),
    drawFilledRect(48, 720, 499, 2, '0.72 0.43 0.30'),
    drawText({
      color: '0.72 0.43 0.30',
      size: 9,
      text: 'INVOICE DETAILS',
      x: 48,
      y: 690,
    }),
    drawText({
      size: 9,
      text: `Invoice date: ${formatInvoiceDate(order.createdAt)}`,
      x: 48,
      y: 672,
    }),
    drawText({
      size: 9,
      text: `Order status: ${formatLabel(order.orderStatus)}`,
      x: 48,
      y: 656,
    }),
    drawText({
      size: 9,
      text: `Payment: ${formatLabel(order.paymentMethod)} - ${formatLabel(order.paymentStatus)}`,
      x: 48,
      y: 640,
    }),
    drawText({
      color: '0.72 0.43 0.30',
      size: 9,
      text: 'BILL TO',
      x: 322,
      y: 690,
    }),
    drawText({
      size: 11,
      text: truncateText(user.name || 'Customer', 35),
      x: 322,
      y: 672,
    }),
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: truncateText(user.email || 'Not set', 38),
      x: 322,
      y: 656,
    }),
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: `Phone: ${order.contactPhone || 'Not set'}`,
      x: 322,
      y: 640,
    }),
    drawText({
      color: '0.72 0.43 0.30',
      size: 9,
      text: 'SHIP TO',
      x: 322,
      y: 612,
    }),
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: truncateText(order.shippingAddress || 'Not set', 50),
      x: 322,
      y: 596,
    }),
    drawFilledRect(48, 552, 499, 1, '0.87 0.82 0.74'),
    drawText({ color: '0.38 0.34 0.30', size: 9, text: 'Item', x: 48, y: 530 }),
    drawText({ color: '0.38 0.34 0.30', size: 9, text: 'Qty', x: 335, y: 530 }),
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: 'Unit price',
      x: 386,
      y: 530,
    }),
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: 'Line total',
      x: 470,
      y: 530,
    }),
    drawFilledRect(48, 516, 499, 1, '0.87 0.82 0.74'),
  ];

  let y = 492;

  visibleItems.forEach((item, index) => {
    lines.push(
      drawText({
        size: 9,
        text: truncateText(item.productName || 'Product', 44),
        x: 48,
        y,
      }),
    );
    lines.push(
      drawText({ size: 9, text: String(item.quantity ?? 1), x: 339, y }),
    );
    lines.push(
      drawRightText({
        size: 9,
        text: formatPrice(getUnitPrice(item)),
        x: 438,
        y,
      }),
    );
    lines.push(
      drawRightText({
        size: 9,
        text: formatPrice(getLineSubtotal(item)),
        x: 532,
        y,
      }),
    );
    lines.push(drawFilledRect(48, y - 12, 499, 0.7, '0.92 0.89 0.84'));
    y -= 28;
  });

  if (items.length > visibleItems.length) {
    lines.push(
      drawText({
        color: '0.38 0.34 0.30',
        size: 8,
        text: `${items.length - visibleItems.length} more item(s) omitted from compact invoice.`,
        x: 48,
        y,
      }),
    );
    y -= 24;
  }

  lines.push(
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: 'Subtotal',
      x: 380,
      y: 224,
    }),
  );
  lines.push(
    drawRightText({ size: 9, text: formatPrice(subtotal), x: 532, y: 224 }),
  );
  lines.push(drawFilledRect(380, 207, 152, 1, '0.87 0.82 0.74'));
  lines.push(
    drawText({
      color: '0.72 0.43 0.30',
      size: 12,
      text: 'Total due',
      x: 380,
      y: 184,
    }),
  );
  lines.push(
    drawRightText({
      color: '0.09 0.08 0.07',
      size: 18,
      text: formatPrice(total),
      x: 532,
      y: 181,
    }),
  );
  lines.push(
    drawText({ color: '0.72 0.43 0.30', size: 9, text: 'NOTE', x: 48, y: 224 }),
  );
  lines.push(
    drawText({
      color: '0.38 0.34 0.30',
      size: 9,
      text: truncateText(
        order.notes ||
          'Keep this invoice for your records. We will update your order status as it moves.',
        78,
      ),
      x: 48,
      y: 204,
    }),
  );
  lines.push(drawFilledRect(40, 44, 515, 36, '0.09 0.08 0.07'));
  lines.push(
    drawText({
      color: '1 1 1',
      size: 9,
      text: 'Thank you for shopping with Artisane.',
      x: 64,
      y: 58,
    }),
  );
  lines.push(
    drawRightText({
      color: '0.89 0.76 0.62',
      size: 8,
      text: 'support@artisane.com',
      x: 531,
      y: 58,
    }),
  );

  const content = lines.join('\n');
  const contentObject = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    contentObject,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'ascii');
};

export const sendOrderInvoiceEmail = async (order: TInvoiceOrder) => {
  const user = getInvoiceUser(order);

  if (!user.email) {
    throw new AppError(500, 'Order customer email is not available');
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    attachments: [
      {
        content: buildInvoicePdf(order),
        contentType: 'application/pdf',
        filename: getInvoiceFileName(order),
      },
    ],
    from: config.smtp.from,
    html: buildInvoiceHtml(order),
    subject: `Your Artisane invoice - ${getOrderRef(order)}`,
    text: buildInvoiceText(order),
    to: user.email,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetLink: string,
) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: config.smtp.from,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #181512;">
        <h2>Reset your Artisane password</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Use the link below to reset your password. It expires soon.</p>
        <p><a href="${resetLink}" style="display:inline-block;background:#181512;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:700;">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    subject: 'Reset your Artisane password',
    text: `Reset your Artisane password: ${resetLink}`,
    to: email,
  });
};
