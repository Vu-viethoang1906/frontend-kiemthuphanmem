import fileExists from '../_utils/fileExists';
describe('pages/Settings/Settings', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Settings/Settings')).toBe(true);
  });
});
