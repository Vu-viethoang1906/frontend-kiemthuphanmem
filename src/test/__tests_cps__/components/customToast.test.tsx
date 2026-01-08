import fileExists from '../_utils/fileExists';
describe('components/CustomToast', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/CustomToast')).toBe(true);
  });
});
