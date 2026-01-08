import fileExists from '../_utils/fileExists';
describe('components/ToastNotification', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/ToastNotification')).toBe(true);
  });
});
