'use client';

import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { isStackEnabled, enableStack, disableStack } from '@/lib/mise/stacks';

type InlineStackToggleProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
  stackKey: string;
  label: string;
  variant?: 'button' | 'placeholder';
};

/**
 * Inline stack toggle component
 * - Used within sections to enable/disable stacks
 * - Uses unversioned keys only (e.g., "prep": 1, not "prep@1")
 * - Can render as a button or subtle placeholder
 */
export function InlineStackToggle({
  recipe,
  onChange,
  stackKey,
  label,
  variant = 'button',
}: InlineStackToggleProps) {
  const isEnabled = isStackEnabled(recipe.stacks, stackKey);

  const handleToggle = () => {
    const nextStacks = isEnabled
      ? disableStack(recipe.stacks, stackKey)
      : enableStack(recipe.stacks, stackKey);

    const next = {
      ...recipe,
      stacks: nextStacks,
    };

    onChange(next);
  };

  if (variant === 'placeholder') {
    return (
      <div
        onClick={handleToggle}
        style={{
          padding: '16px',
          border: '1px dashed #d0d0d0',
          borderRadius: '4px',
          backgroundColor: '#fafafa',
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.backgroundColor = '#f0f9ff';
          e.currentTarget.style.color = '#3b82f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d0d0d0';
          e.currentTarget.style.backgroundColor = '#fafafa';
          e.currentTarget.style.color = '#999';
        }}
      >
        <span style={{ fontSize: '16px', marginRight: '8px' }}>+</span>
        {label}
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      style={{
        padding: '8px 16px',
        border: '1px solid #d0d0d0',
        borderRadius: '4px',
        backgroundColor: isEnabled ? '#f0f9ff' : '#fff',
        color: isEnabled ? '#1e40af' : '#666',
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'all 0.2s',
      }}
    >
      {isEnabled ? `✓ ${label}` : `+ ${label}`}
    </button>
  );
}

/**
 * CapabilitiesPanel - Legacy component (kept for backward compatibility)
 * Now replaced by inline toggles within sections
 * @deprecated Use InlineStackToggle within sections instead
 */
export default function CapabilitiesPanel({
  recipe,
  onChange,
}: {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
}) {
  // This component is deprecated but kept for any remaining usage
  return null;
}

