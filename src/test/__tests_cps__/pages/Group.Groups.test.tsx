import fileExists from '../_utils/fileExists';
describe('pages/Group/Groups', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Group/Groups')).toBe(true);
  });
});
