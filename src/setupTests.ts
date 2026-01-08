import { server } from './test/test-utils/msw.server';
// Global MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

import '@testing-library/jest-dom';

// Force axios to use the CommonJS build in Jest (CRA Jest 27 can't load axios ESM)
// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('axios', () => require('axios/dist/node/axios.cjs'));

// jsdom navigation stub: prevent noisy errors when assigning location.href
const __originalLocation = window.location;
beforeAll(() => {
  // Basic matchMedia mock used by some UI libs (react-hot-toast uses it)
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    });
  }
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      // minimal shape used by app code/tests
      href: 'http://localhost/',
      origin: 'http://localhost',
      pathname: '/',
      search: '',
      hash: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    } as unknown as Location,
  });
});

afterAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: __originalLocation,
  });
});

// Console noise suppression: keep warnings/errors available for explicit opt-in
// Tests needing real console output can call enableRealConsole() locally.
const silentFns: Array<keyof Console> = ['log', 'info', 'debug'];
const errorFns: Array<keyof Console> = ['warn', 'error'];
const originalConsole: Partial<Record<keyof Console, any>> = {};

function createSilent(fnName: keyof Console) {
  return (...args: unknown[]) => {
    // Allow explicit whitelisting by prefix token
    if (typeof args[0] === 'string' && args[0].startsWith('[ALLOW_CONSOLE]')) {
      originalConsole[fnName]?.apply(console, args);
      return;
    }
    // Swallow output
  };
}

beforeAll(() => {
  [...silentFns, ...errorFns].forEach((fn) => {
    originalConsole[fn] = console[fn];
    // Keep errors & warns routeable for assertion: wrap with noop unless explicitly whitelisted
    console[fn] = createSilent(fn) as any;
  });
});

afterAll(() => {
  Object.entries(originalConsole).forEach(([fn, impl]) => {
    if (impl) (console as any)[fn] = impl;
  });
});

// Helper exported for tests that want to re-enable console output temporarily
export function enableRealConsole() {
  Object.entries(originalConsole).forEach(([fn, impl]) => {
    if (impl) (console as any)[fn] = impl;
  });
}

export function disableSilentConsole() {
  [...silentFns, ...errorFns].forEach((fn) => {
    console[fn] = createSilent(fn) as any;
  });
}
