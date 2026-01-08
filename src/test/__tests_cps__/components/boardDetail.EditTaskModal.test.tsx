import fileExists from '../_utils/fileExists';
describe('components/BoardDetail/EditTaskModal', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/BoardDetail/EditTaskModal')).toBe(true);
  });
});
