import fileExists from '../_utils/fileExists';
describe('components/HelpButton/HelpButton', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/HelpButton/HelpButton')).toBe(true);
  });
});
