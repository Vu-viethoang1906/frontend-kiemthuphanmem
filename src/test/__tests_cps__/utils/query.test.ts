import {
  toIso,
  cleanParams,
  buildQueryString,
  parseQuery,
  serializeQueryParams,
  QueryParams,
} from '../../../utils/query';

describe('query utils', () => {
  describe('toIso', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      
      const result = toIso(date);

      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should convert string to string', () => {
      const result = toIso('test-value');

      expect(result).toBe('test-value');
    });

    it('should convert number to string', () => {
      const result = toIso(123);

      expect(result).toBe('123');
    });

    it('should return undefined for null', () => {
      const result = toIso(null);

      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      const result = toIso(undefined);

      expect(result).toBeUndefined();
    });
  });

  describe('cleanParams', () => {
    it('should remove null and undefined values', () => {
      const params = {
        name: 'test',
        age: null,
        city: undefined,
        active: true,
      };

      const result = cleanParams(params);

      expect(result).toEqual({ name: 'test', active: true });
    });

    it('should remove empty strings', () => {
      const params = {
        name: 'test',
        description: '',
      };

      const result = cleanParams(params);

      expect(result).toEqual({ name: 'test' });
    });

    it('should handle arrays and filter out empty values', () => {
      const params = {
        tags: ['tag1', '', null, 'tag2'],
      };

      const result = cleanParams(params);

      expect(result).toEqual({ tags: ['tag1', 'tag2'] });
    });

    it('should convert Date values to ISO strings', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const params = {
        createdAt: date,
      };

      const result = cleanParams(params);

      expect(result).toEqual({ createdAt: '2024-01-15T10:30:00.000Z' });
    });

    it('should handle array of dates', () => {
      const date1 = new Date('2024-01-01T00:00:00.000Z');
      const date2 = new Date('2024-01-31T23:59:59.000Z');
      const params = {
        dates: [date1, date2],
      };

      const result = cleanParams(params);

      expect(result.dates).toEqual([
        '2024-01-01T00:00:00.000Z',
        '2024-01-31T23:59:59.000Z',
      ]);
    });

    it('should handle numbers and booleans', () => {
      const params = {
        count: 42,
        active: false,
        score: 0,
      };

      const result = cleanParams(params);

      expect(result).toEqual({ count: 42, active: false, score: 0 });
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from params', () => {
      const params = {
        name: 'John',
        age: 30,
        active: true,
      };

      const result = buildQueryString(params);

      expect(result).toBe('?name=John&age=30&active=true');
    });

    it('should return empty string when no params', () => {
      const result = buildQueryString({});

      expect(result).toBe('');
    });

    it('should handle array parameters', () => {
      const params = {
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const result = buildQueryString(params);

      expect(result).toBe('?tags=tag1&tags=tag2&tags=tag3');
    });

    it('should ignore null and undefined values', () => {
      const params = {
        name: 'test',
        age: null,
        city: undefined,
      };

      const result = buildQueryString(params);

      expect(result).toBe('?name=test');
    });

    it('should handle Date parameters', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const params = {
        startDate: date,
      };

      const result = buildQueryString(params);

      expect(result).toBe('?startDate=2024-01-15T10%3A30%3A00.000Z');
    });
  });

  describe('parseQuery', () => {
    it('should parse query string to object', () => {
      const query = '?name=John&age=30&active=true';

      const result = parseQuery(query);

      expect(result).toEqual({
        name: 'John',
        age: '30',
        active: 'true',
      });
    });

    it('should handle empty query string', () => {
      const result = parseQuery('');

      expect(result).toEqual({});
    });

    it('should handle query without question mark', () => {
      const query = 'name=John&age=30';

      const result = parseQuery(query);

      expect(result).toEqual({
        name: 'John',
        age: '30',
      });
    });

    it('should handle special characters', () => {
      const query = '?search=hello%20world&email=test%40example.com';

      const result = parseQuery(query);

      expect(result.search).toBe('hello world');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('serializeQueryParams', () => {
    it('should serialize params to URLSearchParams', () => {
      const params = {
        name: 'John',
        age: 30,
        active: true,
      };

      const result = serializeQueryParams(params);

      expect(result.toString()).toBe('name=John&age=30&active=true');
    });

    it('should skip null, undefined, and empty values', () => {
      const params = {
        name: 'John',
        age: null,
        city: undefined,
        country: '',
      };

      const result = serializeQueryParams(params);

      expect(result.toString()).toBe('name=John');
    });

    it('should handle array values', () => {
      const params = {
        tags: ['tag1', 'tag2'],
      };

      const result = serializeQueryParams(params);

      expect(result.toString()).toBe('tags=tag1&tags=tag2');
    });

    it('should convert numbers and booleans to strings', () => {
      const params = {
        count: 42,
        active: false,
      };

      const result = serializeQueryParams(params);

      expect(result.toString()).toBe('count=42&active=false');
    });

    it('should handle zero as valid value', () => {
      const params = {
        score: 0,
      };

      const result = serializeQueryParams(params);

      expect(result.toString()).toBe('score=0');
    });
  });
});
