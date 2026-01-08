const { spawnSync } = require('child_process');

try {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['--no-install', 'lint-staged'];
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  process.exit(result.status || 0);
} catch (err) {
  console.error('Failed to run lint-staged:', err);
  process.exit(2);
}
