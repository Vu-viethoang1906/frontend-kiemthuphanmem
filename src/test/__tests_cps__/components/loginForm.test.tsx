import fileExists from '../_utils/fileExists';
describe('components/LoginForm', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/LoginForm')).toBe(true);
  });
});
