import fileExists from '../_utils/fileExists';

describe('pages/DashBoard/DashboardHome', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/DashBoard/DashboardHome')).toBe(true);
  });
});
