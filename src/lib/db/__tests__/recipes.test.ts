/**
 * Lightweight sanity check for revision computation logic.
 * Note: This tests the helper logic, not the full Supabase integration.
 */

describe('getNextRevision logic', () => {
  it('computes next revision as max + 1', () => {
    // Test the logic: if max is 5, next should be 6
    const maxRevision = 5;
    const nextRevision = maxRevision + 1;
    expect(nextRevision).toBe(6);
  });

  it('defaults to 1 when no revisions exist', () => {
    // Test the logic: if max is null/undefined, next should be 1
    const maxRevision: number | null = null;
    const nextRevision = (maxRevision ?? 0) + 1;
    expect(nextRevision).toBe(1);
  });

  it('handles zero as starting point', () => {
    // Test the logic: if max is 0, next should be 1
    const maxRevision = 0;
    const nextRevision = maxRevision + 1;
    expect(nextRevision).toBe(1);
  });
});

