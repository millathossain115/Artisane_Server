import config from '../../config/index.js';
import AppError from '../../errors/appError.js';

type TSteadfastPoliceStation = {
  big_parcel?: number | string | null;
  district_id?: number | string | null;
  hub_id?: number | string | null;
  id?: number | string | null;
  name?: string | null;
  post_code?: string | number | null;
  status?: number | string | null;
};

type TSteadfastDistrict = {
  id?: number | string | null;
  name?: string | null;
  policestations?: TSteadfastPoliceStation[];
};

type TDistrictResponse = {
  id: string;
  name: string;
  zoneCount: number;
};

type TZoneResponse = {
  bigParcel?: boolean;
  districtId: string;
  hubId?: string;
  id: string;
  name: string;
  postCode?: string;
  status?: string;
};

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
  const baseUrl = config.courier.steadfast.base_url.replace(/\/$/, '');
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
  const rawPayload = await response.text();
  let payload: unknown;

  try {
    payload = JSON.parse(rawPayload);
  } catch {
    throw new AppError(
      response.ok ? 502 : response.status >= 500 ? 502 : response.status,
      'Steadfast location endpoint did not return JSON',
    );
  }

  if (!response.ok) {
    throw new AppError(
      response.status >= 500 ? 502 : response.status,
      'Steadfast location fetch failed',
    );
  }

  return payload;
};

const getDistrictRecords = (payload: unknown): TSteadfastDistrict[] => {
  if (Array.isArray(payload)) {
    return payload as TSteadfastDistrict[];
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data;

    if (Array.isArray(data)) {
      return data as TSteadfastDistrict[];
    }
  }

  throw new AppError(502, 'Steadfast location payload shape is not supported');
};

const getStringValue = (value: unknown) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
};

const normalizeDistrict = (district: TSteadfastDistrict): TDistrictResponse => {
  const id = getStringValue(district.id);
  const name = getStringValue(district.name);

  if (!id || !name) {
    throw new AppError(502, 'Steadfast district data is missing id or name');
  }

  return {
    id,
    name,
    zoneCount: Array.isArray(district.policestations)
      ? district.policestations.length
      : 0,
  };
};

const normalizeZone = (
  districtId: string,
  zone: TSteadfastPoliceStation,
): TZoneResponse => {
  const id = getStringValue(zone.id);
  const name = getStringValue(zone.name);

  if (!id || !name) {
    throw new AppError(502, 'Steadfast zone data is missing id or name');
  }

  return {
    ...(zone.big_parcel === undefined || zone.big_parcel === null
      ? {}
      : { bigParcel: Boolean(Number(zone.big_parcel)) }),
    districtId,
    ...(zone.hub_id === undefined || zone.hub_id === null
      ? {}
      : { hubId: getStringValue(zone.hub_id) }),
    id,
    name,
    ...(zone.post_code === undefined || zone.post_code === null
      ? {}
      : { postCode: getStringValue(zone.post_code) }),
    ...(zone.status === undefined || zone.status === null
      ? {}
      : { status: getStringValue(zone.status) }),
  };
};

const getSteadfastDistricts = async (path: string) => {
  const payload = await fetchSteadfastLocation(path);

  return getDistrictRecords(payload);
};

const getDistricts = async (): Promise<TDistrictResponse[]> => {
  const districts = await getSteadfastDistricts(
    config.courier.steadfast.districts_path,
  );

  return districts.map(normalizeDistrict);
};

const getZonesByDistrict = async (
  districtId: string,
): Promise<TZoneResponse[]> => {
  const districts = await getSteadfastDistricts(
    config.courier.steadfast.zones_path,
  );
  const district = districts.find(
    (item) => getStringValue(item.id) === districtId,
  );

  if (!district) {
    throw new AppError(404, 'District not found');
  }

  return (district.policestations || []).map((zone) =>
    normalizeZone(districtId, zone),
  );
};

export const LocationServices = {
  getDistricts,
  getZonesByDistrict,
};
