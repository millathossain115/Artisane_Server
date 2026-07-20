import config from '../../config/index.js';
import AppError from '../../errors/appError.js';

const requireConfigValue = (value: string | undefined, label: string) => {
  if (!value) {
    throw new AppError(500, `${label} is not configured`);
  }

  return value;
};

const buildSteadfastUrl = (
  pathTemplate: string,
  params?: Record<string, string>,
) => {
  const baseUrl = requireConfigValue(
    config.courier.steadfast.base_url,
    'STEADFAST_BASE_URL',
  ).replace(/\/$/, '');
  let path = pathTemplate;

  for (const [key, value] of Object.entries(params || {})) {
    path = path.replace(`:${key}`, encodeURIComponent(value));
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${baseUrl}/${path.replace(/^\//, '')}`;
};

const getSteadfastHeaders = () => {
  return {
    'Api-Key': requireConfigValue(
      config.courier.steadfast.api_key,
      'STEADFAST_API_KEY',
    ),
    'Secret-Key': requireConfigValue(
      config.courier.steadfast.secret_key,
      'STEADFAST_SECRET_KEY',
    ),
  };
};

const fetchSteadfastLocation = async (
  path: string,
  params?: Record<string, string>,
) => {
  const response = await fetch(buildSteadfastUrl(path, params), {
    headers: getSteadfastHeaders(),
    method: 'GET',
  });
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new AppError(
      response.status >= 500 ? 502 : response.status,
      'Steadfast location fetch failed',
    );
  }

  return payload;
};

const getDistricts = async () => {
  return fetchSteadfastLocation(config.courier.steadfast.districts_path);
};

const getZonesByDistrict = async (districtId: string) => {
  return fetchSteadfastLocation(config.courier.steadfast.zones_path, {
    districtId,
  });
};

export const LocationServices = {
  getDistricts,
  getZonesByDistrict,
};
