import fileExists from '../_utils/fileExists';
describe('components/HelpButton/GuideModal', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/HelpButton/GuideModal')).toBe(true);
  });
});
