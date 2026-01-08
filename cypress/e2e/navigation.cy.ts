/// <reference types="cypress" />

describe('Navigation Flow', () => {
  beforeEach(() => {
    // Login trước mỗi test
    const email = Cypress.env('TEST_USER_EMAIL') || 'user@test.com';
    const password = Cypress.env('TEST_USER_PASSWORD') || 'user123';
    cy.login(email, password);
    cy.waitForApiCalls();
  });

  it('should navigate to dashboard home', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    
    // Kiểm tra các elements chính trên dashboard
    cy.get('body').should('be.visible');
  });

  it('should navigate to projects page', () => {
    cy.visit('/dashboard/projects');
    cy.url().should('include', '/projects');
    cy.waitForApiCalls();
  });

  it('should navigate to groups page', () => {
    cy.visit('/dashboard/groups');
    cy.url().should('include', '/groups');
    cy.waitForApiCalls();
  });

  it('should navigate to reports page', () => {
    cy.visit('/dashboard/reports');
    cy.url().should('include', '/reports');
    cy.waitForApiCalls();
  });

  it('should navigate to settings page', () => {
    cy.visit('/dashboard/settings');
    cy.url().should('include', '/settings');
    cy.waitForApiCalls();
  });

  it('should navigate to profile page', () => {
    cy.visit('/dashboard/profile');
    cy.url().should('include', '/profile');
    cy.waitForApiCalls();
  });

  it('should navigate using sidebar menu', () => {
    cy.visit('/dashboard');
    
    // Tìm và click vào sidebar menu items
    // Cần điều chỉnh selector dựa trên UI thực tế
    cy.get('body').then(($body) => {
      // Kiểm tra sidebar có tồn tại không
      if ($body.find('[data-testid="sidebar"], .sidebar, nav').length > 0) {
        // Thử click vào một menu item (ví dụ: Projects)
        cy.get('[data-testid="sidebar"] a[href*="projects"], .sidebar a[href*="projects"], nav a[href*="projects"]')
          .first()
          .click({ force: true });
        
        cy.url().should('include', '/projects');
      }
    });
  });

  it('should maintain authentication state during navigation', () => {
    cy.visit('/dashboard');
    cy.checkAuth();
    
    cy.visit('/dashboard/projects');
    cy.checkAuth();
    
    cy.visit('/dashboard/groups');
    cy.checkAuth();
  });
});

describe('Admin Navigation Flow', () => {
  beforeEach(() => {
    // Login as admin
    cy.loginAsAdmin();
    cy.waitForApiCalls();
  });

  it('should navigate to admin dashboard', () => {
    cy.visit('/admin');
    cy.url().should('include', '/admin');
  });

  it('should navigate to user management page', () => {
    cy.visit('/admin/usermanagement');
    cy.url().should('include', '/usermanagement');
    cy.waitForApiCalls();
  });

  it('should navigate to role and permission page', () => {
    cy.visit('/admin/roleandpermission');
    cy.url().should('include', '/roleandpermission');
    cy.waitForApiCalls();
  });
});



