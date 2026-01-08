export function createCrudApi() {
  return {
    list: jest.fn(async (...args: any[]) => ({ data: [] })),
    get: jest.fn(async (...args: any[]) => ({ data: null })),
    create: jest.fn(async (...args: any[]) => ({ data: null })),
    update: jest.fn(async (...args: any[]) => ({ data: null })),
    remove: jest.fn(async (...args: any[]) => ({ data: null })),
  };
}
