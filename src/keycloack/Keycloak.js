
import Keycloak from 'keycloak-js';

// Singleton pattern to prevent multiple Keycloak instances
let keycloakInstance = null;

const getKeycloakInstance = () => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: 'https://id.dev.codegym.vn/auth', // URL Keycloak server
      realm: 'codegym-software-nhom-6',      // Realm
      clientId: 'Test-keyclock',               // Client ID
    });
  }
  return keycloakInstance;
};

// Check if we're in development mode and prevent re-initialization
if (process.env.NODE_ENV === 'development') {
  // In development, use global variable to persist across hot reloads
  if (!window.__KEYCLOAK_INSTANCE__) {
    window.__KEYCLOAK_INSTANCE__ = getKeycloakInstance();
  }
  var keycloak = window.__KEYCLOAK_INSTANCE__;
} else {
  var keycloak = getKeycloakInstance();
}

export default keycloak;
