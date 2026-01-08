import fileExists from '../_utils/fileExists';
describe('components/LoadingScreen', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/LoadingScreen')).toBe(true);
  });
});
