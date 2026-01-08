import {
  isoToDateTimeLocal,
  datetimeLocalToISO,
  dateToISOWithoutSeconds,
} from '../../../utils/datetimeUtils';

describe('datetimeUtils', () => {
  describe('isoToDateTimeLocal', () => {
    it('should return empty string for undefined input', () => {
      expect(isoToDateTimeLocal(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(isoToDateTimeLocal('')).toBe('');
    });

    it('should convert valid ISO string to datetime-local format', () => {
      const iso = '2025-02-13T09:30:00.000Z';
      const result = isoToDateTimeLocal(iso);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should handle ISO string with timezone', () => {
      const iso = '2025-02-13T09:30:00Z';
      const result = isoToDateTimeLocal(iso);
      expect(result).toContain('2025-02-13');
      expect(result).toContain('T');
    });

    it('should return empty string for invalid date', () => {
      expect(isoToDateTimeLocal('invalid-date')).toBe('');
    });

    it('should format date correctly with padding', () => {
      const iso = '2025-01-05T03:05:00.000Z';
      const result = isoToDateTimeLocal(iso);
      expect(result).toMatch(/2025-01-05T\d{2}:\d{2}/);
    });
  });

  describe('datetimeLocalToISO', () => {
    it('should return null for undefined input', () => {
      expect(datetimeLocalToISO(undefined)).toBeNull();
    });

    it('should return null for empty string input', () => {
      expect(datetimeLocalToISO('')).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      expect(datetimeLocalToISO('   ')).toBeNull();
    });

    it('should convert valid datetime-local to ISO string', () => {
      const local = '2025-02-13T09:30';
      const result = datetimeLocalToISO(local);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result).toContain('Z');
    });

    it('should return null for invalid date string', () => {
      expect(datetimeLocalToISO('invalid-date')).toBeNull();
    });

    it('should handle datetime-local format correctly', () => {
      const local = '2025-12-25T23:59';
      const result = datetimeLocalToISO(local);
      expect(result).not.toBeNull();
      expect(result).toContain('2025-12-25');
    });
  });

  describe('dateToISOWithoutSeconds', () => {
    it('should return empty string for undefined input', () => {
      expect(dateToISOWithoutSeconds(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(dateToISOWithoutSeconds(invalidDate)).toBe('');
    });

    it('should convert valid Date to ISO without seconds', () => {
      const date = new Date('2025-02-13T09:30:00.000Z');
      const result = dateToISOWithoutSeconds(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(result).not.toContain(':00.000Z');
    });

    it('should return format YYYY-MM-DDTHH:mm', () => {
      const date = new Date('2025-12-25T23:59:00.000Z');
      const result = dateToISOWithoutSeconds(date);
      expect(result.length).toBe(16);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should handle dates at midnight', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const result = dateToISOWithoutSeconds(date);
      expect(result).toContain('T00:00');
    });
  });

  describe('integration tests', () => {
    it('should convert ISO to local and back', () => {
      const iso = '2025-02-13T09:30:00.000Z';
      const local = isoToDateTimeLocal(iso);
      const backToISO = datetimeLocalToISO(local);
      
      expect(backToISO).not.toBeNull();
      if (backToISO) {
        expect(backToISO).toContain('2025-02-13');
      }
    });

    it('should handle Date object conversion', () => {
      const date = new Date();
      const isoWithoutSeconds = dateToISOWithoutSeconds(date);
      const local = isoToDateTimeLocal(isoWithoutSeconds);
      
      expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });
});

