import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

test('build produz dist com home e portfólio preservado', () => {
  execSync('npm run build', { stdio: 'pipe' });
  assert.ok(existsSync('dist/index.html'));
  assert.ok(existsSync('dist/portfolio/index.html'));
  assert.ok(existsSync('dist/portfolio/img/m01-desktop.jpg'));
});
