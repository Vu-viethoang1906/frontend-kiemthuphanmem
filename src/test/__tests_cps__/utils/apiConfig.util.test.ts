import { API_BASE_URL } from '../../../utils/apiConfig';

describe('apiConfig', () => {
  it('should export API_BASE_URL', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('should have API_BASE_URL value', () => {
    expect(API_BASE_URL).toBe('https://your-api-url.com');
  });
});

