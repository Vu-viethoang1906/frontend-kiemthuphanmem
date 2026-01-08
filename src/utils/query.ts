export type Primitive = string | number | boolean | null | undefined | Date;
export type QueryParams = Record<string, Primitive | Primitive[]>;

export const toIso = (d?: Primitive): string | undefined => {
  if (!d) return undefined;
  if (d instanceof Date) return d.toISOString();
  return String(d);
};

export const cleanParams = (params: QueryParams): Record<string, any> => {
  const out: Record<string, any> = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) {
      const arr = v.filter((x) => x !== undefined && x !== null && x !== "");
      if (arr.length) out[k] = arr.map((x) => (x instanceof Date ? x.toISOString() : x));
    } else {
      out[k] = v instanceof Date ? v.toISOString() : v;
    }
  });
  return out;
};

export const buildQueryString = (params: QueryParams): string => {
  const p = cleanParams(params);
  const usp = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((item) => usp.append(k, String(item)));
    else usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
};

export const parseQuery = (search: string): Record<string, string> => {
  const usp = new URLSearchParams(search || "");
  const out: Record<string, string> = {};
  usp.forEach((value, key) => {
    out[key] = value;
  });
  return out;
};

export const serializeQueryParams = (params: Record<string, any>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  }
  return searchParams;
};