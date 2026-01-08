// Minimal import-only test to count statements for an inert module.
// This follows the project's existing "exists" test pattern.

import '../../../styles/login.js';

describe('styles/login.js import', () => {
  it('imports without throwing', () => {
    expect(true).toBe(true);
  });
});
