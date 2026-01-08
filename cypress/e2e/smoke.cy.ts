/// <reference types="cypress" />

/**
 * Smoke tests - Các test cơ bản để kiểm tra ứng dụng có hoạt động không
 * Chạy nhanh để phát hiện các vấn đề nghiêm trọng
 */
describe('Smoke Tests', () => {
  it('should load the application', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('should display login page when not authenticated', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('should be able to access login page directly', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('body').should('be.visible');
  });
});



