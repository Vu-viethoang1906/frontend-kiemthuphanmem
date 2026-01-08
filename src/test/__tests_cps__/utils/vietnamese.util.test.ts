import {
  removeVietnameseTones,
  vietnameseIncludes,
  toIso,
  cleanParams,
  buildQueryString,
  parseQuery,
  serializeQueryParams,
} from '../../../utils/vietnamese';

describe('utils/vietnamese - diacritics helpers', () => {
  it('removeVietnameseTones removes accents and normalizes đ/Đ', () => {
    expect(removeVietnameseTones('Tiếng Việt có dấu: Đặng, Trần, Nguyễn')).toBe(
      'Tieng Viet co dau: Dang, Tran, Nguyen'
    );
    expect(removeVietnameseTones('đ')).toBe('d');
    expect(removeVietnameseTones('Đ')).toBe('D');
  });

  it('vietnameseIncludes matches ignoring accents and case', () => {
    expect(vietnameseIncludes('Trần Văn Bình', 'van binh')).toBe(true);
    expect(vietnameseIncludes('Hà Nội', 'ha noi')).toBe(true);
    expect(vietnameseIncludes('Đà Nẵng', 'da')).toBe(true);
    expect(vietnameseIncludes('Sài Gòn', 'Ha Noi')).toBe(false);
    expect(vietnameseIncludes('', 'test')).toBe(false);
    expect(vietnameseIncludes('abc', '')).toBe(false);
  });
});

describe('utils/vietnamese - query helpers (duplicated with utils/query)', () => {
  it('toIso handles undefined, Date, and primitives', () => {
    expect(toIso(undefined)).toBeUndefined();
    const d = new Date('2020-01-02T03:04:05.000Z');
    expect(toIso(d)).toBe(d.toISOString());
    expect(toIso(123)).toBe('123');
    expect(toIso('x')).toBe('x');
    expect(toIso(true)).toBe('true');
  });

  it('cleanParams filters nullish/empty and converts Dates', () => {
    const d = new Date('2020-01-01T00:00:00.000Z');
    const params = {
      a: undefined,
      b: null,
      c: '',
      d: 0,
      e: 'ok',
      f: d,
      g: [1, '', null, undefined, 2, d],
      h: [],
    } as any;

    const out = cleanParams(params);
    expect(out).toEqual({
      d: 0,
      e: 'ok',
      f: d.toISOString(),
      g: [1, 2, d.toISOString()],
    });
    expect('a' in out).toBe(false);
    expect('b' in out).toBe(false);
    expect('c' in out).toBe(false);
    expect('h' in out).toBe(false);
  });

  it('buildQueryString builds correct query and omits empty', () => {
    const d = new Date('2020-01-01T00:00:00.000Z');
    const qs = buildQueryString({ a: 1, b: '', c: [2, 3], d });
    // Since URLSearchParams may reorder, just assert includes
    expect(qs.startsWith('?')).toBe(true);
    expect(qs).toContain('a=1');
    expect(qs).toContain('c=2');
    expect(qs).toContain('c=3');
    expect(qs).toContain(`d=${encodeURIComponent(d.toISOString())}`);
    expect(qs).not.toContain('b=');
  });

  it('parseQuery reads last value for repeated keys', () => {
    const out = parseQuery('?a=1&a=2&b=');
    expect(out).toEqual({ a: '2', b: '' });
  });

  it('serializeQueryParams matches omission rules and handles arrays', () => {
    const usp = serializeQueryParams({ a: 1, b: '', c: [2, 3], d: null });
    const entries = Array.from(usp.entries());
    expect(entries).toContainEqual(['a', '1']);
    expect(entries).toContainEqual(['c', '2']);
    expect(entries).toContainEqual(['c', '3']);
    // b and d omitted
    expect(entries.find((e) => e[0] === 'b')).toBeUndefined();
    expect(entries.find((e) => e[0] === 'd')).toBeUndefined();
  });
});
