import fileExists from '../_utils/fileExists';
describe('pages/Project/Projects', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Project/Projects')).toBe(true);
  });
});
