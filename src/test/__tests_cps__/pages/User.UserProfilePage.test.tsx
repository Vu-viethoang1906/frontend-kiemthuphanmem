import fileExists from '../_utils/fileExists';
describe('pages/User/UserProfilePage', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/User/UserProfilePage')).toBe(true);
  });
});
