import { describe, expect, it } from 'vitest';
import { titleCase } from '@/lib/format';

describe('titleCase', () => {
  it('converts snake_case to Title Case', () => {
    expect(titleCase('office_supplies')).toBe('Office Supplies');
    expect(titleCase('meets_expectations')).toBe('Meets Expectations');
    expect(titleCase('higher_better')).toBe('Higher Better');
    expect(titleCase('in_progress')).toBe('In Progress');
  });

  it('handles kebab-case and extra whitespace', () => {
    expect(titleCase('end-of-contract')).toBe('End Of Contract');
    expect(titleCase('  multiple   words ')).toBe('Multiple Words');
  });

  it('normalises mixed casing', () => {
    expect(titleCase('MEETS_expectations')).toBe('Meets Expectations');
  });

  it('returns an empty string for null/empty input', () => {
    expect(titleCase(null)).toBe('');
    expect(titleCase(undefined)).toBe('');
    expect(titleCase('')).toBe('');
  });
});
