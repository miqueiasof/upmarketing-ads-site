// Lead score for the diagnosis form. Points per answer value; priority A/B/C by total.
export const SCORE = {
  revenue: { pre: 0, lt2k: 1, '2-10k': 2, '10-50k': 3, '50-200k': 4, gt200k: 5 },
  budget: { lt500: 0, '500-1500': 1, unsure: 1, '1500-5000': 3, gt5000: 4 },
  timeline: { exploring: 0, '1-3m': 2, now: 3 },
  pain_duration: { lt3m: 0, '3-12m': 1, '1-3y': 2, 'since-start': 2 },
};

export const PRIORITY_A_MIN = 10;
export const PRIORITY_B_MIN = 6;

export function computeScore(answers = {}) {
  let points = 0;
  for (const [field, table] of Object.entries(SCORE)) {
    const value = answers[field];
    if (typeof value === 'string' && Object.hasOwn(table, value)) points += table[value];
  }
  const priority = points >= PRIORITY_A_MIN ? 'A' : points >= PRIORITY_B_MIN ? 'B' : 'C';
  return { points, priority };
}
