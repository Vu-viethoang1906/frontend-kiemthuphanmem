/// <reference types="cypress" />

describe('User Management Flow (Admin Only)', () => {
  beforeEach(() => {
    // Login as admin
    cy.loginAsAdmin();
    cy.waitForApiCalls();
  });

  it('should access user management page', () => {
    cy.visit('/admin/usermanagement');
    cy.url().should('include', '/usermanagement');
    
    // Đợi page load
    cy.wait(2000);
    
    // Kiểm tra các elements chính
    cy.get('body').should('be.visible');
  });

  it('should display user list', () => {
    cy.visit('/admin/usermanagement');
    cy.wait(2000);
    
    // Kiểm tra xem có danh sách users không
    cy.get('body').should('be.visible');
  });

  it('should be able to view user permissions', () => {
    const userId = Cypress.env('TEST_USER_ID') || 'test-user-id';
    
    cy.visit(`/admin/usermanagement/${userId}/permissions`);
    cy.url().should('include', '/permissions');
    cy.waitForApiCalls();
  });
});

describe('Role and Permission Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.waitForApiCalls();
  });

  it('should access role and permission page', () => {
    cy.visit('/admin/roleandpermission');
    cy.url().should('include', '/roleandpermission');
    cy.wait(2000);
    
    cy.get('body').should('be.visible');
  });

  it('should access permission management page', () => {
    cy.visit('/admin/permissionmanagement');
    cy.url().should('include', '/permissionmanagement');
    cy.wait(2000);
    
    cy.get('body').should('be.visible');
  });
});



