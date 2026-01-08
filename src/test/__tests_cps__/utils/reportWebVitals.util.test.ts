import reportWebVitals from '../../../reportWebVitals';

// web-vitals is dynamically imported; mock it so we can assert calls
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
}));

describe('utils/reportWebVitals', () => {
  it('does nothing when no handler provided', () => {
    // Should not throw and should not import web-vitals
    const result = reportWebVitals();
    expect(result).toBeUndefined();
  });

  it('invokes web-vitals functions with the provided handler', async () => {
    const handler = jest.fn();
    await reportWebVitals(handler);
    const webVitals = await import('web-vitals');
    expect(webVitals.getCLS).toHaveBeenCalledWith(handler);
    expect(webVitals.getFID).toHaveBeenCalledWith(handler);
    expect(webVitals.getFCP).toHaveBeenCalledWith(handler);
    expect(webVitals.getLCP).toHaveBeenCalledWith(handler);
    expect(webVitals.getTTFB).toHaveBeenCalledWith(handler);
  });
});
