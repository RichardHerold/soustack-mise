'use client';

import type { SoustackLiteRecipe } from '@/lib/mise/types';

type EditorTopBarProps = {
  recipe: SoustackLiteRecipe;
  miseMode: 'draft' | 'mise';
  onModeChange: (mode: 'draft' | 'mise') => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
};

/**
 * Computes status indicator from profile + stacks + content
 * Status is derived only, never persisted
 */
function computeStatus(recipe: SoustackLiteRecipe): {
  label: string;
  variant: 'valid' | 'partial' | 'minimal';
} {
  const hasName = recipe.name && recipe.name.trim() !== '' && recipe.name !== 'Untitled Recipe';
  const hasIngredients = Array.isArray(recipe.ingredients) && 
    recipe.ingredients.length > 0 && 
    !recipe.ingredients.every((item: unknown) => {
      const str = String(item);
      return str === '(not provided)' || str.trim() === '';
    });
  const hasInstructions = Array.isArray(recipe.instructions) && 
    recipe.instructions.length > 0 && 
    !recipe.instructions.every((item: unknown) => {
      const str = String(item);
      return str === '(not provided)' || str.trim() === '';
    });

  // Consider profile and stacks in status computation
  const profile = recipe.profile;
  const stacks = recipe.stacks;
  const hasStacks = stacks && Object.keys(stacks).length > 0;
  
  // Profile-specific requirements (for future profiles)
  // For 'lite' profile, stacks are optional
  const profileRequirementsMet = profile === 'lite' || (hasStacks && Object.keys(stacks).length > 0);

  // Valid: has name, ingredients, instructions, and profile requirements met
  if (hasName && hasIngredients && hasInstructions && profileRequirementsMet) {
    return { label: 'Valid', variant: 'valid' };
  } 
  // Partial: has at least name or some content
  else if (hasName || hasIngredients || hasInstructions) {
    return { label: 'Partial', variant: 'partial' };
  } 
  // Minimal: empty or just profile/stacks
  else {
    return { label: 'Minimal', variant: 'minimal' };
  }
}

export default function EditorTopBar({
  recipe,
  miseMode,
  onModeChange,
  onNameChange,
  onDescriptionChange,
}: EditorTopBarProps) {
  const status = computeStatus(recipe);

  const statusColors = {
    valid: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
    partial: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    minimal: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  };

  const statusColor = statusColors[status.variant];

  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Top row: Name and Mode toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={recipe.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Recipe name"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              fontSize: '18px',
              fontWeight: 500,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#f9fafb',
          }}
        >
          <button
            onClick={() => onModeChange('draft')}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: miseMode === 'draft' ? '#000' : 'transparent',
              color: miseMode === 'draft' ? '#fff' : '#666',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Draft
          </button>
          <button
            onClick={() => onModeChange('mise')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderLeft: '1px solid #d0d0d0',
              backgroundColor: miseMode === 'mise' ? '#000' : 'transparent',
              color: miseMode === 'mise' ? '#fff' : '#666',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Mise
          </button>
        </div>

        {/* Status indicator */}
        <div
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            border: `1px solid ${statusColor.border}`,
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {status.label}
        </div>
      </div>

      {/* Description field */}
      <div>
        <input
          type="text"
          value={recipe.description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional description"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  );
}

