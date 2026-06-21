/** Display helpers for turning stored enum/code values into human labels. */

/**
 * Convert a snake_case / kebab-case / lowercase token into Title Case.
 *
 * `office_supplies`      → `Office Supplies`
 * `meets_expectations`   → `Meets Expectations`
 * `higher_better`        → `Higher Better`
 * `in_progress`          → `In Progress`
 *
 * Null/empty input yields an empty string so callers can fall back to a dash.
 */
export function titleCase(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a count with a correctly-pluralised noun.
 *
 * `pluralize(1, 'record')`            → `1 record`
 * `pluralize(3, 'record')`           → `3 records`
 * `pluralize(1, 'entry', 'entries')` → `1 entry`
 *
 * Defaults the plural to `singular + 's'`; pass an explicit plural for
 * irregular nouns.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}
