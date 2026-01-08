import fileExists from '../_utils/fileExists';
describe('pages/Board/BoardSummary', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Board/BoardSummary')).toBe(true);
  });
});
