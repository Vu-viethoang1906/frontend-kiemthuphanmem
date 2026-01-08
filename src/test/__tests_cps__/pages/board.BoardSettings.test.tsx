import fileExists from '../_utils/fileExists';
describe('pages/Board/BoardSettings', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Board/BoardSettings')).toBe(true);
  });
});
