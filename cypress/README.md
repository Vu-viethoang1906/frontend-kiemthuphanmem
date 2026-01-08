# Cypress E2E Testing

Thư mục này chứa các test end-to-end (e2e) sử dụng Cypress để mô phỏng hành vi người dùng.

## Cấu trúc thư mục

```
cypress/
├── e2e/              # Các test e2e
│   ├── login.cy.ts
│   ├── navigation.cy.ts
│   ├── board.cy.ts
│   └── user-management.cy.ts
├── fixtures/         # Dữ liệu test mẫu
├── support/          # Custom commands và configuration
│   ├── commands.ts   # Custom commands (login, logout, etc.)
│   └── e2e.ts        # Support file cho e2e tests
└── README.md         # File này
```

## Cài đặt và chạy

### Cài đặt dependencies
```bash
npm install
```

### Chạy Cypress với UI (Interactive Mode)
```bash
npm run cypress:open
# hoặc
npm run e2e
```

### Chạy Cypress ở chế độ headless (CI/CD)
```bash
npm run cypress:run
# hoặc
npm run e2e:ci
```

## Cấu hình

### Environment Variables

Tạo file `.env` hoặc `.env.local` với các biến sau (tùy chọn):

```env
# Test credentials
TEST_USER_EMAIL=user@test.com
TEST_USER_PASSWORD=user123
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=admin123

# Test data IDs
TEST_BOARD_ID=your-board-id
TEST_TASK_ID=your-task-id
TEST_USER_ID=your-user-id
```

Hoặc có thể set trong `cypress.config.ts`:

```typescript
env: {
  TEST_USER_EMAIL: 'user@test.com',
  TEST_USER_PASSWORD: 'user123',
  // ...
}
```

### Base URL

Mặc định base URL là `http://localhost:3000`. Có thể thay đổi trong `cypress.config.ts`:

```typescript
e2e: {
  baseUrl: 'http://localhost:3000',
  // ...
}
```

## Custom Commands

Các custom commands đã được định nghĩa trong `cypress/support/commands.ts`:

### `cy.login(email, password)`
Đăng nhập với email và password.

```typescript
cy.login('user@test.com', 'password123');
```

### `cy.loginAsAdmin()`
Đăng nhập với tài khoản admin (sử dụng env variables).

```typescript
cy.loginAsAdmin();
```

### `cy.loginAsUser()`
Đăng nhập với tài khoản user thường (sử dụng env variables).

```typescript
cy.loginAsUser();
```

### `cy.logout()`
Đăng xuất khỏi hệ thống.

```typescript
cy.logout();
```

### `cy.waitForApiCalls()`
Đợi các API calls hoàn thành.

```typescript
cy.waitForApiCalls();
```

### `cy.navigateTo(path)`
Điều hướng đến một path cụ thể.

```typescript
cy.navigateTo('/dashboard/projects');
```

### `cy.checkAuth()`
Kiểm tra xem user đã được authenticated chưa (kiểm tra token trong localStorage).

```typescript
cy.checkAuth();
```

## Viết test mới

### Ví dụ test đơn giản

```typescript
describe('My Feature', () => {
  beforeEach(() => {
    // Setup trước mỗi test
    cy.loginAsUser();
  });

  it('should do something', () => {
    cy.visit('/dashboard');
    // Your test code here
  });
});
```

### Best Practices

1. **Sử dụng custom commands**: Sử dụng các custom commands đã định nghĩa để code ngắn gọn và dễ maintain.

2. **Cleanup**: Luôn cleanup state trước mỗi test (clear localStorage, cookies, etc.).

3. **Wait strategies**: Sử dụng `cy.wait()` hoặc `cy.waitForApiCalls()` khi cần đợi API calls hoàn thành.

4. **Selectors**: Ưu tiên sử dụng `data-testid` attributes trong code để dễ test hơn.

5. **Isolation**: Mỗi test nên độc lập, không phụ thuộc vào test khác.

## Các test hiện có

### `login.cy.ts`
- Test các flow đăng nhập
- Test validation
- Test remember me
- Test redirect sau login

### `navigation.cy.ts`
- Test navigation giữa các pages
- Test sidebar navigation
- Test authentication state

### `board.cy.ts`
- Test hiển thị boards/projects
- Test board detail
- Test board settings
- Test task interactions

### `user-management.cy.ts`
- Test user management (admin only)
- Test role and permission management

## Troubleshooting

### Test fails với timeout
- Kiểm tra xem app đã chạy chưa (`npm start`)
- Tăng timeout trong `cypress.config.ts` nếu cần
- Kiểm tra network requests có đang pending không

### Selectors không tìm thấy
- Kiểm tra xem element đã render chưa
- Sử dụng `cy.wait()` để đợi element xuất hiện
- Kiểm tra selector có đúng không bằng cách inspect trong browser

### Authentication issues
- Kiểm tra test credentials có đúng không
- Kiểm tra token có được lưu vào localStorage không
- Xem console logs để debug

## CI/CD Integration

Để chạy tests trong CI/CD pipeline:

```bash
# Chạy tests headless
npm run e2e:ci

# Hoặc với specific browser
npx cypress run --browser chrome
```

## Tài liệu tham khảo

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Custom Commands](https://docs.cypress.io/api/cypress-api/custom-commands)



