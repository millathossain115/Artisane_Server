import fs from 'fs';
import path from 'path';
import dns from 'dns';
import mongoose, { type Types } from 'mongoose';
import config from '../config/index.js';
import { Category } from '../modules/category/category.model.js';
import { Product } from '../modules/product/product.model.js';

type SeedProduct = {
  name: string;
  brand?: string;
  price: number | string;
  stock?: number;
  description?: string;
};

type SeedFile = {
  category: {
    name: string;
    slug: string;
    description?: string;
  };
  source: {
    site: string;
    url?: string;
    note?: string;
  };
  products: SeedProduct[];
};

const DEFAULT_STOCK = 20;
const DNS_SERVERS = (process.env.SEED_DNS_SERVERS ?? '8.8.8.8,1.1.1.1')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);
const productUploadDir = path.join(process.cwd(), 'uploads', 'products');
const seedImagePrefix = 'seed-artist-brush';
const colorThemes = [
  { accent: '#b9573f', dark: '#2f5f60', light: '#f7f2e9' },
  { accent: '#d49a2f', dark: '#313f6b', light: '#f4f0fb' },
  { accent: '#5a8f62', dark: '#5b3a29', light: '#eff6ed' },
  { accent: '#8f4f86', dark: '#283d4f', light: '#f7eef4' },
  { accent: '#427f9e', dark: '#523729', light: '#edf6f8' },
  { accent: '#c76a35', dark: '#34452f', light: '#fbf1e9' },
] as const;

const seedDataPath = path.join(
  process.cwd(),
  'src',
  'app',
  'seed',
  'seed-products.json',
);

function readSeedFile() {
  return JSON.parse(fs.readFileSync(seedDataPath, 'utf8')) as SeedFile;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizePrice(value: number | string) {
  if (typeof value === 'number') {
    return value;
  }

  const normalized = Number(value.replace(/[^\d.]/g, ''));

  if (!Number.isFinite(normalized)) {
    throw new Error(`Invalid seed product price: ${value}`);
  }

  return normalized;
}

function createPublicBaseUrl() {
  return (
    process.env.SEED_PUBLIC_BASE_URL ??
    `http://localhost:${String(config.port || 5000)}`
  ).replace(/\/$/, '');
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createSeedImageFile(seedProduct: SeedProduct, index: number) {
  const slug = createSlug(seedProduct.name);
  const theme = colorThemes[index % colorThemes.length]!;
  const filename = `${seedImagePrefix}-${slug}.svg`;
  const filePath = path.join(productUploadDir, filename);
  const displayName =
    seedProduct.name.length > 42
      ? `${seedProduct.name.slice(0, 39).trim()}...`
      : seedProduct.name;
  const brushRotation = -18 + (index % 6) * 8;
  const paintX = 180 + (index % 4) * 54;
  const paintY = 180 + (index % 3) * 62;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-labelledby="title desc">
  <title id="title">${escapeSvgText(seedProduct.name)}</title>
  <desc id="desc">Generated local seed image for ${escapeSvgText(seedProduct.name)}.</desc>
  <rect width="1200" height="900" fill="${theme.light}"/>
  <rect x="72" y="72" width="1056" height="756" fill="#fffdf8" stroke="${theme.dark}" stroke-width="5" opacity="0.92"/>
  <circle cx="${paintX}" cy="${paintY}" r="86" fill="${theme.accent}" opacity="0.92"/>
  <circle cx="${paintX + 144}" cy="${paintY + 72}" r="58" fill="${theme.dark}" opacity="0.88"/>
  <circle cx="${paintX + 270}" cy="${paintY - 24}" r="42" fill="#e7bd56" opacity="0.9"/>
  <g transform="translate(600 420) rotate(${brushRotation})">
    <path d="M-340 170 180-350c43-43 114-33 141 21 19 38 12 82-18 113L-217 304c-35 35-91 35-126 0s-35-92 3-134Z" fill="#b97845"/>
    <path d="M196-364c58-43 137-39 190 10l78 71-145 150-85-78c-45-41-59-102-38-153Z" fill="${theme.dark}"/>
    <path d="M-269 223 230-276" stroke="#f4d7ad" stroke-width="46" stroke-linecap="round"/>
    <circle cx="314" cy="-270" r="17" fill="#f4d7ad"/>
  </g>
  <rect x="156" y="638" width="888" height="118" fill="#ffffff" opacity="0.82"/>
  <text x="600" y="690" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="${theme.dark}">${escapeSvgText(displayName)}</text>
  <text x="600" y="735" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${theme.accent}">${escapeSvgText(seedProduct.brand ?? 'Artisane')}</text>
</svg>
`;

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, svg);
  }

  return filename;
}

function createSeedImages(seedProducts: SeedProduct[]) {
  fs.mkdirSync(productUploadDir, { recursive: true });

  return new Map(
    seedProducts.map((seedProduct, index) => [
      createSlug(seedProduct.name),
      createSeedImageFile(seedProduct, index),
    ]),
  );
}

async function upsertCategory(seedFile: SeedFile) {
  const category = await Category.findOneAndUpdate(
    { slug: seedFile.category.slug },
    {
      $set: {
        ...seedFile.category,
        isDeleted: false,
        seedSource: {
          site: seedFile.source.site,
          url: seedFile.source.url,
          capturedAt: new Date(),
          note: seedFile.source.note,
        },
      },
    },
    { returnDocument: 'after', upsert: true },
  );

  return category._id as Types.ObjectId;
}

async function upsertProducts(seedFile: SeedFile, categoryId: Types.ObjectId) {
  const publicBaseUrl = createPublicBaseUrl();
  const imageFilesBySlug = createSeedImages(seedFile.products);
  let created = 0;
  let updated = 0;

  for (const seedProduct of seedFile.products) {
    const slug = createSlug(seedProduct.name);
    const previousProduct = await Product.findOne({ slug })
      .select('_id')
      .lean();
    const imageFile = imageFilesBySlug.get(slug);

    await Product.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: seedProduct.name.trim(),
          slug,
          description: seedProduct.description?.trim(),
          price: normalizePrice(seedProduct.price),
          stock: seedProduct.stock ?? DEFAULT_STOCK,
          category: categoryId,
          brand: seedProduct.brand?.trim(),
          images: imageFile
            ? [`${publicBaseUrl}/uploads/products/${imageFile}`]
            : [],
          isDeleted: false,
          seedSource: {
            site: seedFile.source.site,
            url: seedFile.source.url,
            capturedAt: new Date(),
            note: seedFile.source.note,
          },
        },
      },
      { returnDocument: 'after', upsert: true },
    );

    if (previousProduct) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return { created, updated, total: seedFile.products.length };
}

async function runSeed() {
  if (!config.database_url) {
    throw new Error('DATABASE_URL is required to run the seed script');
  }

  dns.setServers(DNS_SERVERS);
  const seedFile = readSeedFile();

  await mongoose.connect(config.database_url);

  try {
    const categoryId = await upsertCategory(seedFile);
    const result = await upsertProducts(seedFile, categoryId);

    console.log(
      `Seeded Artist Brushes & Tools: ${result.created} created, ${result.updated} updated, ${result.total} total.`,
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
