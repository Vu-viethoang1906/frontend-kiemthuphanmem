import fileExists from '../_utils/fileExists';
describe('components/PageWrapper', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/PageWrapper')).toBe(true);
  });
});
