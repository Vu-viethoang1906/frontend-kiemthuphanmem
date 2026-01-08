import fileExists from '../_utils/fileExists';
describe('pages/Board/BoardMember', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Board/BoardMember')).toBe(true);
  });
});
