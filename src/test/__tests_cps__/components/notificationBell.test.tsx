import fileExists from '../_utils/fileExists';
describe('components/NotificationBell', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/NotificationBell')).toBe(true);
  });
});
