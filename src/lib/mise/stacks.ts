/**
 * Stack key constants and helper functions for managing recipe stacks.
 * Enforces canonical convention: unversioned stack keys only (e.g., "prep": 1, not "prep@1").
 */

export const STACK_KEYS = [
  'prep',
  'equipment',
  'timed',
  'storage',
  'scaling',
  'structured',
  'referenced',
  'illustrated',
] as const;

export type StackKey = (typeof STACK_KEYS)[number];

/**
 * Check if a stack is enabled (using unversioned key only).
 */
export function isStackEnabled(
  stacks: Record<string, unknown>,
  key: string
): boolean {
  return key in stacks && stacks[key] !== undefined;
}

/**
 * Enable a stack by setting its unversioned key to version 1.
 */
export function enableStack(
  stacks: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  return {
    ...stacks,
    [key]: 1,
  };
}

/**
 * Disable a stack by removing its unversioned key.
 */
export function disableStack(
  stacks: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const next = { ...stacks };
  delete next[key];
  return next;
}

/**
 * Migrate versioned stack keys to unversioned format.
 * If stacks contains any "<name>@1", migrate them to "<name>":1 and delete the "@1" keys.
 * Also removes invalid versioned keys (e.g., "<name>@2", "invalid@1").
 * Returns a new stacks object (does not mutate input).
 */
export function migrateVersionedStackKeys(
  stacks: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...stacks };
  let hasChanges = false;

  // Find all versioned keys (e.g., "prep@1", "storage@1")
  for (const key of Object.keys(next)) {
    if (key.includes('@')) {
      const [baseName, version] = key.split('@');
      // Only migrate if it's a valid stack key and version is "1"
      if (STACK_KEYS.includes(baseName as StackKey) && version === '1') {
        // If unversioned key doesn't exist, create it
        if (!(baseName in next)) {
          next[baseName] = 1;
          hasChanges = true;
        }
        // Delete the versioned key
        delete next[key];
        hasChanges = true;
      } else {
        // Remove invalid versioned keys (wrong version or invalid stack name)
        delete next[key];
        hasChanges = true;
      }
    }
  }

  return hasChanges ? next : stacks;
}

