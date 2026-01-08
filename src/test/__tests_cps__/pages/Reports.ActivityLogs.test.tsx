import fileExists from '../_utils/fileExists';
describe('pages/Reports/ActivityLogs', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Reports/ActivityLogs')).toBe(true);
  });
});




