import {
  migrateVersionedStackKeys,
  isStackEnabled,
  enableStack,
  disableStack,
  STACK_KEYS,
} from '../stacks';

describe('stacks', () => {
  describe('migrateVersionedStackKeys', () => {
    it('migrates versioned keys to unversioned format', () => {
      const stacks = {
        'prep@1': 1,
        'storage@1': 1,
        'timed@1': 1,
      };

      const result = migrateVersionedStackKeys(stacks);

      expect(result).toEqual({
        prep: 1,
        storage: 1,
        timed: 1,
      });
      expect(result).not.toHaveProperty('prep@1');
      expect(result).not.toHaveProperty('storage@1');
      expect(result).not.toHaveProperty('timed@1');
    });

    it('preserves unversioned keys', () => {
      const stacks = {
        prep: 1,
        storage: 1,
        'timed@1': 1,
      };

      const result = migrateVersionedStackKeys(stacks);

      expect(result).toEqual({
        prep: 1,
        storage: 1,
        timed: 1,
      });
    });

    it('does not migrate invalid versioned keys', () => {
      const stacks = {
        'prep@2': 1,
        'invalid@1': 1,
        'prep@1': 1,
      };

      const result = migrateVersionedStackKeys(stacks);

      expect(result).toEqual({
        prep: 1,
      });
      expect(result).not.toHaveProperty('prep@2');
      expect(result).not.toHaveProperty('invalid@1');
    });

    it('returns same object if no migration needed', () => {
      const stacks = {
        prep: 1,
        storage: 1,
      };

      const result = migrateVersionedStackKeys(stacks);

      expect(result).toBe(stacks); // Same reference when no changes
    });

    it('handles empty stacks', () => {
      const stacks = {};

      const result = migrateVersionedStackKeys(stacks);

      expect(result).toEqual({});
      expect(result).toBe(stacks);
    });

    it('handles mixed versioned and unversioned keys', () => {
      const stacks = {
        prep: 1,
        'storage@1': 1,
        'equipment@1': 1,
        scaling: 1,
      };

      const result = migrateVersionedStackKeys(stacks);

      expect(result).toEqual({
        prep: 1,
        storage: 1,
        equipment: 1,
        scaling: 1,
      });
    });
  });

  describe('isStackEnabled', () => {
    it('returns true when stack is enabled', () => {
      const stacks = { prep: 1, storage: 1 };

      expect(isStackEnabled(stacks, 'prep')).toBe(true);
      expect(isStackEnabled(stacks, 'storage')).toBe(true);
    });

    it('returns false when stack is not enabled', () => {
      const stacks = { prep: 1 };

      expect(isStackEnabled(stacks, 'storage')).toBe(false);
      expect(isStackEnabled(stacks, 'timed')).toBe(false);
    });

    it('returns false for undefined stacks', () => {
      expect(isStackEnabled({}, 'prep')).toBe(false);
    });
  });

  describe('enableStack', () => {
    it('adds stack with version 1', () => {
      const stacks = { prep: 1 };

      const result = enableStack(stacks, 'storage');

      expect(result).toEqual({
        prep: 1,
        storage: 1,
      });
    });

    it('does not mutate original stacks', () => {
      const stacks = { prep: 1 };

      enableStack(stacks, 'storage');

      expect(stacks).toEqual({ prep: 1 });
    });

    it('overwrites existing stack value', () => {
      const stacks = { storage: 2 };

      const result = enableStack(stacks, 'storage');

      expect(result).toEqual({ storage: 1 });
    });
  });

  describe('disableStack', () => {
    it('removes stack key', () => {
      const stacks = { prep: 1, storage: 1 };

      const result = disableStack(stacks, 'storage');

      expect(result).toEqual({ prep: 1 });
      expect(result).not.toHaveProperty('storage');
    });

    it('does not mutate original stacks', () => {
      const stacks = { prep: 1, storage: 1 };

      disableStack(stacks, 'storage');

      expect(stacks).toEqual({ prep: 1, storage: 1 });
    });

    it('handles non-existent stack gracefully', () => {
      const stacks = { prep: 1 };

      const result = disableStack(stacks, 'storage');

      expect(result).toEqual({ prep: 1 });
    });
  });

  describe('STACK_KEYS', () => {
    it('contains all valid stack keys', () => {
      expect(STACK_KEYS).toContain('prep');
      expect(STACK_KEYS).toContain('equipment');
      expect(STACK_KEYS).toContain('timed');
      expect(STACK_KEYS).toContain('storage');
      expect(STACK_KEYS).toContain('scaling');
      expect(STACK_KEYS).toContain('structured');
      expect(STACK_KEYS).toContain('referenced');
      expect(STACK_KEYS).toContain('illustrated');
    });
  });
});

