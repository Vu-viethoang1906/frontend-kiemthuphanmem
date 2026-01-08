import '@testing-library/jest-dom';

// Provide a root element
beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  // Mock matchMedia for theme listener coverage
  // @ts-ignore
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchEvent: () => false,
  }));
});

// Mock heavy providers and modules to avoid side effects
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));

jest.mock('@react-keycloak/web', () => ({
  ReactKeycloakProvider: ({ children }: any) => children,
}));

// Mock AppWrapper to a trivial component so we don't pull router
jest.mock('../../../AppWrapper', () => ({ __esModule: true, default: () => null }));

// Provide a virtual mock for react-router-dom to satisfy index imports
// Use virtual to avoid Jest trying to resolve the real ESM package here
// and keep BrowserRouter trivial.
// @ts-ignore
jest.mock('react-router-dom', () => ({ BrowserRouter: ({ children }: any) => children }), { virtual: true });

jest.mock('../../../reportWebVitals', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../components/ModalProvider', () => ({ ModalProvider: ({ children }: any) => children }));
jest.mock('../../../keycloack/Keycloak', () => ({}));

jest.mock('../../../utils/theme', () => ({
  getStoredTheme: () => 'light',
  applyTheme: jest.fn(),
}));

test('index.tsx mounts app without crashing', async () => {
  // Import after mocks
  await import('../../../index');
  const { createRoot }: any = jest.requireMock('react-dom/client');
  expect(createRoot).toHaveBeenCalled();
  const rootArg = createRoot.mock.calls[0][0];
  expect(rootArg).toBeInstanceOf(HTMLElement);
});
