// Password strength rules.
// Production-grade: 8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special.
// Returns a human-readable list of missing requirements + a 0–5 strength score.

export interface PasswordIssue { id: string; label: string }

export function passwordIssues(p: string): PasswordIssue[] {
  const issues: PasswordIssue[] = [];
  if (!p || p.length < 8) issues.push({ id: 'len', label: 'At least 8 characters' });
  if (!/[A-Z]/.test(p)) issues.push({ id: 'upper', label: 'An uppercase letter (A–Z)' });
  if (!/[a-z]/.test(p)) issues.push({ id: 'lower', label: 'A lowercase letter (a–z)' });
  if (!/[0-9]/.test(p)) issues.push({ id: 'num', label: 'A number (0–9)' });
  if (!/[^A-Za-z0-9]/.test(p)) issues.push({ id: 'special', label: 'A special character (!@#…)' });
  return issues;
}

export interface PasswordStrength { score: number; label: string; color: string }

export function passwordStrength(p: string): PasswordStrength {
  if (!p) return { score: 0, label: '', color: '#666' };
  const score = 5 - passwordIssues(p).length;
  if (score <= 1) return { score, label: 'Weak', color: '#FF3B5C' };
  if (score === 2) return { score, label: 'Fair', color: '#FFB339' };
  if (score === 3) return { score, label: 'Good', color: '#FFB339' };
  if (score === 4) return { score, label: 'Strong', color: '#22C55E' };
  return { score: 5, label: 'Very strong', color: '#22C55E' };
}

// Phone number normalization — strip everything but digits and a leading +.
// Two numbers are considered the same if their normalized forms match.
export function normalizePhone(p: string): string {
  if (!p) return '';
  const trimmed = p.trim().replace(/[\s\-()]/g, '');
  // Keep optional leading +, then digits only
  const sign = trimmed.startsWith('+') ? '+' : '';
  return sign + trimmed.replace(/\+/g, '').replace(/[^0-9]/g, '');
}
