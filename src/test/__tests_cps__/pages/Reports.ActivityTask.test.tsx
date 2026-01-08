import fileExists from '../_utils/fileExists';
describe('pages/Reports/ActivityTask', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Reports/ActivityTask')).toBe(true);
  });
});




