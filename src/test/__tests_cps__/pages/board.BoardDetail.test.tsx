import fileExists from '../_utils/fileExists';
describe('pages/Board/BoardDetail', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Board/BoardDetail')).toBe(true);
  });
});
