import fileExists from '../_utils/fileExists';

describe('pages/Center/CenterManagement', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Center/CenterManagement')).toBe(true);
  });
});
