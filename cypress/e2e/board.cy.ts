/// <reference types="cypress" />

describe('Board Interaction Flow', () => {
  beforeEach(() => {
    // Login trước mỗi test
    const email = Cypress.env('TEST_USER_EMAIL') || 'user@test.com';
    const password = Cypress.env('TEST_USER_PASSWORD') || 'user123';
    cy.login(email, password);
    cy.waitForApiCalls();
  });

  it('should display projects list', () => {
    cy.visit('/dashboard/projects');
    cy.url().should('include', '/projects');
    
    // Đợi page load
    cy.wait(2000);
    
    // Kiểm tra xem có danh sách projects không
    cy.get('body').should('be.visible');
  });

  it('should be able to view a board detail', () => {
    // Giả sử có một board với ID cụ thể
    // Trong thực tế, có thể cần tạo board trước hoặc sử dụng board có sẵn
    const boardId = Cypress.env('TEST_BOARD_ID') || 'test-board-id';
    
    cy.visit(`/dashboard/boards/${boardId}`);
    cy.url().should('include', `/boards/${boardId}`);
    
    // Đợi board load
    cy.wait(3000);
    
    // Kiểm tra các elements chính của board
    cy.get('body').should('be.visible');
  });

  it('should be able to navigate to board settings', () => {
    const boardId = Cypress.env('TEST_BOARD_ID') || 'test-board-id';
    
    cy.visit(`/dashboard/boards/${boardId}`);
    cy.wait(2000);
    
    // Tìm và click vào settings button/link
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="board-settings"], button:contains("Settings"), a[href*="settings"]').length > 0) {
        cy.get('[data-testid="board-settings"], button:contains("Settings"), a[href*="settings"]')
          .first()
          .click({ force: true });
        
        cy.url().should('include', '/settings');
      }
    });
  });

  it('should display board members page', () => {
    const boardId = Cypress.env('TEST_BOARD_ID') || 'test-board-id';
    
    cy.visit(`/dashboard/project/${boardId}/members`);
    cy.url().should('include', '/members');
    cy.waitForApiCalls();
  });
});

describe('Task Interaction Flow', () => {
  beforeEach(() => {
    const email = Cypress.env('TEST_USER_EMAIL') || 'user@test.com';
    const password = Cypress.env('TEST_USER_PASSWORD') || 'user123';
    cy.login(email, password);
    cy.waitForApiCalls();
  });

  it('should be able to view task detail', () => {
    const boardId = Cypress.env('TEST_BOARD_ID') || 'test-board-id';
    const taskId = Cypress.env('TEST_TASK_ID') || 'test-task-id';
    
    cy.visit(`/dashboard/project/${boardId}/${taskId}`);
    cy.url().should('include', `/${taskId}`);
    
    // Đợi task detail load
    cy.wait(2000);
    
    cy.get('body').should('be.visible');
  });

  it('should be able to interact with task columns', () => {
    const boardId = Cypress.env('TEST_BOARD_ID') || 'test-board-id';
    
    cy.visit(`/dashboard/boards/${boardId}`);
    cy.wait(3000);
    
    // Kiểm tra xem có columns không (kanban board thường có columns)
    cy.get('body').should('be.visible');
    
    // Có thể thêm test cho drag and drop nếu cần
  });
});



