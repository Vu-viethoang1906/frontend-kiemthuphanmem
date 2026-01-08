import fileExists from '../_utils/fileExists';
describe('components/BoardSetting/SwimlaneManager', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/BoardSetting/SwimlaneManager')).toBe(true);
  });
});
