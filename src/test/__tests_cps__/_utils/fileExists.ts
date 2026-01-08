import fs from 'fs';
import path from 'path';

export default function fileExists(relPathFromSrc: string): boolean {
  const extensions = [
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '/index.tsx',
    '/index.ts',
    '/index.jsx',
    '/index.js',
  ];
  // _utils is at src/test/__tests_cps__/_utils, so src is three levels up
  const base = path.resolve(__dirname, '..', '..', '..', relPathFromSrc);
  return extensions.some((ext) => fs.existsSync(base + ext));
}
