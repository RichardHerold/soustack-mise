/**
 * Slugifies a string for use in filenames/URLs.
 * - Lowercase
 * - Replace non-alphanumeric with dashes
 * - Trim dashes
 * - Fallback to "recipe" if empty
 */
export function slugify(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'recipe';
  }

  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'recipe';
}

