import '@testing-library/jest-dom';

// Ensure a root and matchMedia for each isolated import
beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
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
  localStorage.clear();
  jest.resetModules();
  jest.clearAllMocks();
});

test('index: tokenLogger stores tokens and onEvent logs errors', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  jest.isolateModules(() => {
    // A tiny renderer to execute function components and their children
    const tinyRender = (el: any): any => {
      if (!el) return null;
      if (typeof el.type === 'function') {
        const out = el.type(el.props || {});
        return tinyRender(out);
      }
      const children = el.props?.children;
      if (Array.isArray(children)) {
        children.forEach(tinyRender);
      } else if (children) {
        tinyRender(children);
      }
      return null;
    };
    jest.doMock('react-dom/client', () => ({
      createRoot: jest.fn(() => ({
        render: (element: any) => tinyRender(element),
      })),
    }));

    jest.doMock('@react-keycloak/web', () => ({
      ReactKeycloakProvider: ({ children, onTokens, onEvent }: any) => {
        // Invoke callbacks to hit tokenLogger/eventLogger branches
        onTokens?.({ token: 'tok', refreshToken: 'ref' });
        onEvent?.('ready', new Error('boom'));
        return children;
      },
    }));

    jest.doMock('../../../components/ModalProvider', () => ({ ModalProvider: ({ children }: any) => children }));
    jest.doMock('react-router-dom', () => ({ BrowserRouter: ({ children }: any) => children }), { virtual: true });
    jest.doMock('../../../AppWrapper', () => ({ __esModule: true, default: () => null }));
    jest.doMock('../../../reportWebVitals', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('../../../keycloack/Keycloak', () => ({}));
    jest.doMock('../../../utils/theme', () => ({ getStoredTheme: () => 'light', applyTheme: jest.fn() }));

    require('../../../index');
  });

  expect(localStorage.getItem('token')).toBe('tok');
  expect(localStorage.getItem('refreshToken')).toBe('ref');
  expect(localStorage.getItem('Type_login')).toBe('SSO');
  expect(errorSpy).toHaveBeenCalled();
  errorSpy.mockRestore();
});

test('index: tokenLogger clears storage when no token and SSO type set', async () => {
  localStorage.setItem('Type_login', 'SSO');

  jest.isolateModules(() => {
    const tinyRender = (el: any): any => {
      if (!el) return null;
      if (typeof el.type === 'function') {
        const out = el.type(el.props || {});
        return tinyRender(out);
      }
      const children = el.props?.children;
      if (Array.isArray(children)) {
        children.forEach(tinyRender);
      } else if (children) {
        tinyRender(children);
      }
      return null;
    };
    jest.doMock('react-dom/client', () => ({
      createRoot: jest.fn(() => ({
        render: (element: any) => tinyRender(element),
      })),
    }));

    jest.doMock('@react-keycloak/web', () => ({
      ReactKeycloakProvider: ({ children, onTokens }: any) => {
        // Invoke without token to trigger clear branch
        onTokens?.({});
        return children;
      },
    }));

    jest.doMock('../../../components/ModalProvider', () => ({ ModalProvider: ({ children }: any) => children }));
    jest.doMock('react-router-dom', () => ({ BrowserRouter: ({ children }: any) => children }), { virtual: true });
    jest.doMock('../../../AppWrapper', () => ({ __esModule: true, default: () => null }));
    jest.doMock('../../../reportWebVitals', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('../../../keycloack/Keycloak', () => ({}));
    jest.doMock('../../../utils/theme', () => ({ getStoredTheme: () => 'light', applyTheme: jest.fn() }));

    require('../../../index');
  });

  expect(localStorage.getItem('Type_login')).toBeNull();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('refreshToken')).toBeNull();
});
