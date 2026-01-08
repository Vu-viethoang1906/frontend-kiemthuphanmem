import fileExists from '../_utils/fileExists';
describe('pages/Board/lineChart', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Board/lineChart')).toBe(true);
  });
});
