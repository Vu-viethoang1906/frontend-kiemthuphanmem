import fileExists from '../_utils/fileExists';
describe('pages/Reports/LogByUser', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Reports/LogByUser')).toBe(true);
  });
});

