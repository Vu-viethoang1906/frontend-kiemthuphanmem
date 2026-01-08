import fileExists from '../_utils/fileExists';
describe('components/ModalProvider', () => {
  it('should exist on disk', () => {
    expect(fileExists('components/ModalProvider')).toBe(true);
  });
});
