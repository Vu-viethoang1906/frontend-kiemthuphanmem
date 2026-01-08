import fileExists from '../_utils/fileExists';
describe('components/DocumentationModal', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/DocumentationModal')).toBe(true);
  });
});
