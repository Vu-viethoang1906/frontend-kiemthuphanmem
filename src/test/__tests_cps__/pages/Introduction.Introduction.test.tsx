import fileExists from '../_utils/fileExists';
describe('pages/Introduction/Introduction', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Introduction/Introduction')).toBe(true);
  });
});
