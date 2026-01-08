import fileExists from '../_utils/fileExists';
describe('components/BoardDetail/CreateTaskModal', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/BoardDetail/CreateTaskModal')).toBe(true);
  });
});
