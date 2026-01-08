import fileExists from '../_utils/fileExists';
describe('components/Pagination', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/Pagination')).toBe(true);
  });
});
