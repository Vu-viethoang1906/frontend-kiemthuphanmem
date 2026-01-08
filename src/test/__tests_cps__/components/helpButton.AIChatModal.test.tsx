import fileExists from '../_utils/fileExists';
describe('components/HelpButton/AIChatModal', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/HelpButton/AIChatModal')).toBe(true);
  });
});
