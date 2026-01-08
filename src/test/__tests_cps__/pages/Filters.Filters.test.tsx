import fileExists from '../_utils/fileExists';
describe('pages/Filters/Filters', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Filters/Filters')).toBe(true);
  });
});
