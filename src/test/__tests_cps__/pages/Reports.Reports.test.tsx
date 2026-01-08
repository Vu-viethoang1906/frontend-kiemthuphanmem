import fileExists from '../_utils/fileExists';
describe('pages/Reports/Reports', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Reports/Reports')).toBe(true);
  });
});
