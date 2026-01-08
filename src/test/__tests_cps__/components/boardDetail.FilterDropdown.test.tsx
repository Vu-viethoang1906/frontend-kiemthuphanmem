import fileExists from '../_utils/fileExists';
describe('components/BoardDetail/FilterDropdown', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/BoardDetail/FilterDropdown')).toBe(true);
  });
});
