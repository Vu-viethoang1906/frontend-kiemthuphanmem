import {
  toIso,
  cleanParams,
  buildQueryString,
  parseQuery,
  serializeQueryParams,
} from '../../../utils/query';

describe('utils/query', () => {
  it('toIso works with different inputs', () => {
    const d = new Date('2023-02-03T04:05:06.000Z');
    expect(toIso(undefined)).toBeUndefined();
    expect(toIso(d)).toBe(d.toISOString());
    // Current implementation treats falsy non-date values as undefined
    expect(toIso(0)).toBeUndefined();
    expect(toIso(false)).toBeUndefined();
  });

  it('cleanParams cleans and normalizes params', () => {
    const d = new Date('2021-01-01T00:00:00.000Z');
    const result = cleanParams({ a: '', b: 1, c: [undefined, 2, '', d] });
    expect(result).toEqual({ b: 1, c: [2, d.toISOString()] });
  });

  it('buildQueryString builds query string', () => {
    const q = buildQueryString({ a: 1, b: ['x', 'y'] });
    expect(q.startsWith('?')).toBe(true);
    expect(q).toMatch(/a=1/);
    expect(q).toMatch(/b=x/);
    expect(q).toMatch(/b=y/);
  });

  it('parseQuery parses string', () => {
    const out = parseQuery('?a=1&b=2');
    expect(out).toEqual({ a: '1', b: '2' });
  });

  it('serializeQueryParams skips null/undefined/empty and handles arrays', () => {
    const usp = serializeQueryParams({ a: null, b: undefined, c: '', d: [1, 2] });
    expect(Array.from(usp.entries())).toEqual([
      ['d', '1'],
      ['d', '2'],
    ]);
  });
});
