import fileExists from '../_utils/fileExists';
describe('components/ProtectedRoute', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/ProtectedRoute')).toBe(true);
  });
});
