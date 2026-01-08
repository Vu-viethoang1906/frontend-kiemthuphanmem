import fileExists from '../_utils/fileExists';
describe('pages/Login/CodeGymLogin', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Login/CodeGymLogin')).toBe(true);
  });
});
