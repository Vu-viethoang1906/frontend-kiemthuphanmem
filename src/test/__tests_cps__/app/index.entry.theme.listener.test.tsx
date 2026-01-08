import '@testing-library/jest-dom';

test('index: falls back to addListener when addEventListener missing', async () => {
  document.body.innerHTML = '<div id="root"></div>';
  // Provide matchMedia without addEventListener so else branch executes
  // @ts-ignore
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  });

  jest.isolateModules(() => {
    jest.doMock('react-dom/client', () => ({
      createRoot: jest.fn(() => ({ render: jest.fn() })),
    }));
    jest.doMock('@react-keycloak/web', () => ({ ReactKeycloakProvider: ({ children }: any) => children }));
    jest.doMock('../../../../src/components/ModalProvider', () => ({ ModalProvider: ({ children }: any) => children }));
    jest.doMock('react-router-dom', () => ({ BrowserRouter: ({ children }: any) => children }), { virtual: true });
    jest.doMock('../../../../src/AppWrapper', () => ({ __esModule: true, default: () => null }));
    jest.doMock('../../../../src/reportWebVitals', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('../../../../src/keycloack/Keycloak', () => ({}));
    jest.doMock('../../../../src/utils/theme', () => ({ getStoredTheme: () => 'system', applyTheme: jest.fn() }));

    require('../../../index');
  });
});
