import fileExists from '../_utils/fileExists';
describe('components/BoardDetail/TaskCard', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/BoardDetail/TaskCard')).toBe(true);
  });
});
