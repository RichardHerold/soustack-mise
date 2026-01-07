'use client';

import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { computeMiseChecks } from './MiseCheckPanel';
import { enableStack, isStackEnabled } from '@/lib/mise/stacks';

type MiseGuidanceRailProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
};

/**
 * Maps check IDs to stack keys that can be enabled via CTA.
 * Some checks suggest enabling a related stack (e.g., timed-plain-strings suggests structured).
 * Only shows CTA if the suggested stack is not already enabled.
 * 
 * Note: Most checks in computeMiseChecks only appear when a stack is already enabled.
 * CTAs are shown for related stacks that would help address the check's concern.
 */
function getStackKeyForCheck(checkId: string, stacks: Record<string, unknown>): string | null {
  // Map check IDs to their corresponding stack keys that should be enabled
  // These are stacks that would help address the issue identified by the check
  const checkToStackMap: Record<string, string> = {
    // timed-plain-strings: timed is enabled but instructions are plain strings
    // Suggests enabling structured stack to support structured instructions with timing
    'timed-plain-strings': 'structured',
    // referenced-no-structured: referenced is enabled but instructions aren't structured
    // Suggests enabling structured stack first to support structured format with inputs[]
    'referenced-no-structured': 'structured',
  };

  const suggestedStack = checkToStackMap[checkId];
  
  // Only return the stack key if it's not already enabled
  if (suggestedStack && !isStackEnabled(stacks, suggestedStack)) {
    return suggestedStack;
  }

  return null;
}

/**
 * Gets the CTA label for a stack key.
 */
function getCtaLabel(stackKey: string): string {
  const labels: Record<string, string> = {
    prep: 'Enable Prep',
    storage: 'Enable Storage',
    timed: 'Enable Timed',
    structured: 'Enable Structured',
    referenced: 'Enable Referenced',
    equipment: 'Enable Equipment',
  };

  return labels[stackKey] || `Enable ${stackKey}`;
}

/**
 * MiseGuidanceRail - Advisory guidance panel
 * Only visible when miseMode === "mise" and there are checks to show
 * Provides actionable guidance with optional CTAs to enable stacks
 */
export default function MiseGuidanceRail({
  recipe,
  onChange,
}: MiseGuidanceRailProps) {
  const checks = computeMiseChecks(recipe);

  // Don't render if there are no checks
  if (checks.length === 0) {
    return null;
  }

  const handleEnableStack = (stackKey: string) => {
    const next = {
      ...recipe,
      stacks: enableStack(recipe.stacks, stackKey),
    };
    onChange(next);
  };

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        borderLeft: '1px solid #e0e0e0',
        backgroundColor: '#fafafa',
        overflow: 'auto',
        padding: '24px',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#333',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Mise Guidance
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {checks.map((check) => {
          const stackKey = getStackKeyForCheck(check.id, recipe.stacks);
          const shouldShowCta = !!stackKey;

          return (
            <div
              key={check.id}
              style={{
                padding: '12px',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: '1.5',
              }}
            >
              <div
                style={{
                  color: check.severity === 'warning' ? '#92400e' : '#374151',
                  marginBottom: shouldShowCta ? '8px' : '0',
                }}
              >
                {check.message}
              </div>
              {shouldShowCta && (
                <button
                  onClick={() => handleEnableStack(stackKey)}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    width: '100%',
                  }}
                >
                  {getCtaLabel(stackKey)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

