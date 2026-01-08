import fileExists from '../_utils/fileExists';
describe('components/Sidebar', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/Sidebar')).toBe(true);
  });
});
