import fileExists from '../_utils/fileExists';
describe('components/BoardSetting/ColumnManager', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/BoardSetting/ColumnManager')).toBe(true);
  });
});
