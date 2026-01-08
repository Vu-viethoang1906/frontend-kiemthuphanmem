import fileExists from '../_utils/fileExists';
describe('pages/Login/Login', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Login/Login')).toBe(true);
  });
});
