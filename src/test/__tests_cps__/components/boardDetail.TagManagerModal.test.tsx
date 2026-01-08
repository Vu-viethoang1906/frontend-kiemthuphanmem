import fileExists from '../_utils/fileExists';
describe('components/BoardDetail/TagManagerModal', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/BoardDetail/TagManagerModal')).toBe(true);
  });
});
