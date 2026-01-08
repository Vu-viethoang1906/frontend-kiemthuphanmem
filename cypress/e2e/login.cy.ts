/// <reference types="cypress" />

describe('Login Flow', () => {
  beforeEach(() => {
    // Clear localStorage và cookies trước mỗi test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display login page correctly', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    
    // Kiểm tra các elements cơ bản trên trang login
    cy.get('input[type="email"], input[name="email"]').should('be.visible');
    cy.get('input[type="password"], input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show error message with invalid credentials', () => {
    cy.visit('/login');
    
    cy.get('input[type="email"], input[name="email"]').type('invalid@test.com');
    cy.get('input[type="password"], input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Đợi error message xuất hiện (có thể là toast hoặc error text)
    cy.wait(2000);
    // Kiểm tra xem có error message không (có thể là toast notification)
    cy.get('body').should('contain.text', 'Login failed').or('contain.text', 'error').or('contain.text', 'Invalid');
  });

  it('should successfully login with valid credentials and redirect to dashboard', () => {
    const email = Cypress.env('TEST_USER_EMAIL') || 'user@test.com';
    const password = Cypress.env('TEST_USER_PASSWORD') || 'user123';
    
    cy.visit('/login');
    cy.login(email, password);
    
    // Sau khi login thành công, nên redirect về dashboard hoặc admin
    cy.url().should('satisfy', (url) => {
      return url.includes('/dashboard') || url.includes('/admin');
    });
    
    // Kiểm tra token đã được lưu
    cy.checkAuth();
  });

  it('should remember email if remember me is checked', () => {
    const email = 'test@example.com';
    
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').type(email);
    
    // Tìm và check remember me checkbox nếu có
    cy.get('body').then(($body) => {
      if ($body.find('input[type="checkbox"][name*="remember"], input[type="checkbox"][id*="remember"]').length > 0) {
        cy.get('input[type="checkbox"][name*="remember"], input[type="checkbox"][id*="remember"]').check();
      }
    });
    
    // Reload page và kiểm tra email đã được lưu
    cy.reload();
    cy.get('input[type="email"], input[name="email"]').should('have.value', email);
  });

  it('should redirect to login if accessing protected route without authentication', () => {
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    
    // Nên redirect về login
    cy.url().should('include', '/login');
  });

  it('should redirect authenticated user away from login page', () => {
    const email = Cypress.env('TEST_USER_EMAIL') || 'user@test.com';
    const password = Cypress.env('TEST_USER_PASSWORD') || 'user123';
    
    cy.login(email, password);
    
    // Thử truy cập lại login page
    cy.visit('/login');
    
    // Nên redirect về dashboard hoặc admin
    cy.url().should('satisfy', (url) => {
      return url.includes('/dashboard') || url.includes('/admin');
    });
  });
});



