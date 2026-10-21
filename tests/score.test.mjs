import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore } from '../src/assets/js/score.js';

test('A no máximo (14 pontos)', () => {
  assert.deepEqual(
    computeScore({ revenue: 'gt200k', budget: 'gt5000', timeline: 'now', pain_duration: '1-3y' }),
    { points: 14, priority: 'A' },
  );
});

test('limite A/B: 9 é B, 10 é A', () => {
  const base = { revenue: '10-50k', budget: '1500-5000', timeline: '1-3m', pain_duration: '3-12m' };
  assert.deepEqual(computeScore(base), { points: 9, priority: 'B' });
  assert.deepEqual(computeScore({ ...base, timeline: 'now' }), { points: 10, priority: 'A' });
});

test('C com 1 ponto', () => {
  assert.deepEqual(
    computeScore({ revenue: 'pre', budget: 'unsure', timeline: 'exploring', pain_duration: 'lt3m' }),
    { points: 1, priority: 'C' },
  );
});

test('valor inválido ou ausente conta 0', () => {
  assert.deepEqual(computeScore({ revenue: 'xyz' }), { points: 0, priority: 'C' });
  assert.deepEqual(computeScore(), { points: 0, priority: 'C' });
});
