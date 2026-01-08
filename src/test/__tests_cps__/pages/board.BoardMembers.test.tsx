import fileExists from '../_utils/fileExists';
describe('pages/Board/BoardMembers', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Board/BoardMembers')).toBe(true);
  });
});
