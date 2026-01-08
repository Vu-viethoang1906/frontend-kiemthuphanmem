import fileExists from '../_utils/fileExists';
describe('pages/Template/TemplateManagement', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Template/TemplateManagement')).toBe(true);
  });
});
