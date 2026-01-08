/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with email and password
       * @example cy.login('user@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to login as admin user
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>;
      
      /**
       * Custom command to login as regular user
       * @example cy.loginAsUser()
       */
      loginAsUser(): Chainable<void>;
      
      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;
      
      /**
       * Custom command to wait for API calls to complete
       * @example cy.waitForApiCalls()
       */
      waitForApiCalls(): Chainable<void>;
      
      /**
       * Custom command to navigate to a specific page
       * @example cy.navigateTo('/dashboard/projects')
       */
      navigateTo(path: string): Chainable<void>;
      
      /**
       * Custom command to check if user is authenticated
       * @example cy.checkAuth()
       */
      checkAuth(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]').should('be.visible').type(email);
  cy.get('input[type="password"], input[name="password"], input[placeholder*="password" i], input[placeholder*="Password" i]').should('be.visible').type(password);
  cy.get('button[type="submit"], button:contains("Login"), button:contains("Đăng nhập")').click();
  
  // Đợi redirect sau khi login thành công
  cy.url().should('not.include', '/login');
  cy.wait(1000); // Đợi một chút để app load xong
});

// Login as admin (sử dụng test credentials từ env hoặc default)
Cypress.Commands.add('loginAsAdmin', () => {
  const adminEmail = Cypress.env('TEST_ADMIN_EMAIL') || 'admin@test.com';
  const adminPassword = Cypress.env('TEST_ADMIN_PASSWORD') || 'admin123';
  cy.login(adminEmail, adminPassword);
  cy.url().should('include', '/admin');
});

// Login as regular user
Cypress.Commands.add('loginAsUser', () => {
  const userEmail = Cypress.env('TEST_USER_EMAIL') || 'user@test.com';
  const userPassword = Cypress.env('TEST_USER_PASSWORD') || 'user123';
  cy.login(userEmail, userPassword);
  cy.url().should('include', '/dashboard');
});

// Logout command
Cypress.Commands.add('logout', () => {
  // Tìm và click vào logout button/menu
  // Có thể cần điều chỉnh selector dựa trên UI thực tế
  cy.get('body').then(($body) => {
    // Kiểm tra xem có user menu không
    if ($body.find('[data-testid="user-menu"], .user-menu, button:contains("Logout"), button:contains("Đăng xuất")').length > 0) {
      cy.get('[data-testid="user-menu"], .user-menu, button:contains("Logout"), button:contains("Đăng xuất")').first().click();
      cy.get('button:contains("Logout"), button:contains("Đăng xuất"), [data-testid="logout"]').click();
    } else {
      // Nếu không tìm thấy menu, clear localStorage và navigate
      cy.clearLocalStorage();
      cy.visit('/login');
    }
  });
  cy.url().should('include', '/login');
});

// Wait for API calls to complete
Cypress.Commands.add('waitForApiCalls', () => {
  // Đợi một chút để các API calls hoàn thành
  cy.wait(1000);
});

// Navigate to specific page
Cypress.Commands.add('navigateTo', (path: string) => {
  cy.visit(path);
  cy.waitForApiCalls();
});

// Check if user is authenticated
Cypress.Commands.add('checkAuth', () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    expect(token).to.exist;
    expect(token).to.not.be.empty;
  });
});

export {};



