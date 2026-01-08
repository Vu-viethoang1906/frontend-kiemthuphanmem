import fileExists from '../_utils/fileExists';
describe('components/SupportCenter', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/SupportCenter')).toBe(true);
  });
});
