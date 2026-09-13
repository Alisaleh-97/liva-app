// Password validator + phone normaliser — pure functions, no RN dependencies.
// These are the guards that live between "user typed a password" and the
// backend accepting it, so a regression here silently loosens security.

import { passwordIssues, passwordStrength, normalizePhone } from '@/lib/password';

describe('passwordIssues', () => {
  it('rejects an empty password with all 5 issues', () => {
    expect(passwordIssues('').map((i) => i.id).sort()).toEqual(
      ['len', 'lower', 'num', 'special', 'upper'].sort()
    );
  });

  it('rejects a short-but-otherwise-good password on length only', () => {
    // 7 chars, has upper/lower/num/special
    expect(passwordIssues('Abc1!').map((i) => i.id)).toEqual(['len']);
  });

  it('rejects an all-lowercase password on upper/num/special', () => {
    expect(passwordIssues('abcdefgh').map((i) => i.id).sort()).toEqual(
      ['num', 'special', 'upper'].sort()
    );
  });

  it('accepts a strong password with 0 issues', () => {
    expect(passwordIssues('Str0ng!Pass')).toEqual([]);
  });
});

describe('passwordStrength', () => {
  it('scores empty as 0', () => {
    expect(passwordStrength('').score).toBe(0);
  });

  it('scores a strong password as 5', () => {
    const s = passwordStrength('Str0ng!Pass');
    expect(s.score).toBe(5);
    expect(s.label.length).toBeGreaterThan(0);
  });
});

describe('normalizePhone', () => {
  it('strips spaces, dashes, and parens', () => {
    expect(normalizePhone('+971 (50) 123-4567')).toBe('+971501234567');
  });

  it('preserves a single leading +', () => {
    expect(normalizePhone('  +9715012345')).toBe('+9715012345');
  });

  it('collapses multiple + into one', () => {
    expect(normalizePhone('++971501234567')).toBe('+971501234567');
  });

  it('drops letters entirely', () => {
    expect(normalizePhone('+971 50 abc 1234567')).toBe('+971501234567');
  });

  it('returns empty for empty input', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(undefined as any)).toBe('');
  });
});
