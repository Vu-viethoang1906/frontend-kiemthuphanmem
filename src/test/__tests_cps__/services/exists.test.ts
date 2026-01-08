import fileExists from '../_utils/fileExists';

describe('services folder integrity', () => {
  const paths = [
    'services/geminiService',
  ];

  it.each(paths)('%s should exist on disk', (p) => {
    expect(fileExists(p)).toBe(true);
  });
});
