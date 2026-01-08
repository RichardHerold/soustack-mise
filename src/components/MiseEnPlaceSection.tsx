'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { isStackEnabled } from '@/lib/mise/stacks';
import { InlineStackToggle } from './CapabilitiesPanel';

type MiseEnPlaceItem = {
  text: string;
};

type MiseEnPlaceSectionProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
};

/**
 * Mise en Place section component
 * - Visible when prep capability is enabled (recipe.stacks.prep)
 * - Content stored in top-level recipe.miseEnPlace (array of {text,...})
 * - Checklist-style free text items
 * - Orderable items
 */
export default function MiseEnPlaceSection({
  recipe,
  onChange,
}: MiseEnPlaceSectionProps) {
  // Check for prep capability declaration (unversioned key only)
  const isEnabled = isStackEnabled(recipe.stacks, 'prep');
  
  // Get mise en place items from top-level recipe.miseEnPlace
  const getMiseEnPlaceItems = (): MiseEnPlaceItem[] => {
    if (!isEnabled) return [];
    const recipeWithMiseEnPlace = recipe as SoustackLiteRecipe & {
      miseEnPlace?: Array<{ text: string }>;
    };
    const miseEnPlace = recipeWithMiseEnPlace.miseEnPlace;
    if (Array.isArray(miseEnPlace)) {
      return miseEnPlace.filter((item): item is MiseEnPlaceItem => 
        typeof item === 'object' && item !== null && 'text' in item && typeof item.text === 'string'
      );
    }
    return [];
  };

  const [items, setItems] = useState<MiseEnPlaceItem[]>(getMiseEnPlaceItems());
  const [isExpanded, setIsExpanded] = useState(isEnabled);
  // Track if we're making the change ourselves to avoid useEffect sync race
  const isInternalUpdateRef = useRef(false);
  // Track the index of the newly added item to auto-focus it
  const newlyAddedItemIndexRef = useRef<number | null>(null);
  // Store refs to input elements by index
  const inputRefsRef = useRef<Map<number, HTMLInputElement>>(new Map());

  // Sync items when recipe changes externally
  // Merge empty items from local state with non-empty items from recipe
  // This preserves empty items being edited while syncing saved items
  useEffect(() => {
    // Skip sync if we're the ones making the change (prevents race condition)
    if (isInternalUpdateRef.current) {
      // Reset the flag after a short delay to allow the update cycle to complete
      // This ensures subsequent external updates can sync properly
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
      return;
    }
    // Reset the ref flag now that we're doing an external sync
    isInternalUpdateRef.current = false;
    const currentItems = getMiseEnPlaceItems();
    // Merge: keep empty items from local state, add/update non-empty items from recipe
    const emptyLocalItems = items.filter(item => !item.text.trim());
    const mergedItems = [...currentItems, ...emptyLocalItems];
    setItems(mergedItems);
    setIsExpanded(isEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.stacks, (recipe as SoustackLiteRecipe & { miseEnPlace?: Array<{ text: string }> }).miseEnPlace]);

  // Auto-focus newly added input using useLayoutEffect (runs synchronously after DOM updates)
  useLayoutEffect(() => {
    const indexToFocus = newlyAddedItemIndexRef.current;
    if (indexToFocus !== null) {
      const input = inputRefsRef.current.get(indexToFocus);
      if (input && !input.value) {
        // Use requestAnimationFrame to ensure focus happens after browser paint
        requestAnimationFrame(() => {
          if (input && document.contains(input)) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
        newlyAddedItemIndexRef.current = null; // Clear after scheduling focus
      }
    }
  }, [items]);

  const handleItemChange = (index: number, text: string) => {
    // Clear the newly added item ref if user is typing in it
    if (newlyAddedItemIndexRef.current === index) {
      newlyAddedItemIndexRef.current = null;
    }
    const newItems = [...items];
    newItems[index] = { text };
    updateItems(newItems);
  };

  const handleAddItem = () => {
    const newItems = [...items, { text: '' }];
    const newItemIndex = newItems.length - 1;
    // Update local state immediately so the UI shows the input field right away
    // Don't call updateItems for empty items - it will be called when user types
    // Set the internal update flag to prevent useEffect from interfering
    isInternalUpdateRef.current = true;
    // Mark the newly added item index for auto-focus
    newlyAddedItemIndexRef.current = newItemIndex;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateItems(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    updateItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    updateItems(newItems);
  };

  const updateItems = (newItems: MiseEnPlaceItem[]) => {
    // Mark that we're making an internal update (prevents useEffect from syncing back)
    isInternalUpdateRef.current = true;
    // Always update local state first (allows empty items for editing)
    // This ensures the UI updates immediately, showing the input field
    setItems(newItems);
    
    // Filter out empty items only when saving to recipe
    const filteredItems = newItems.filter((item) => item.text.trim().length > 0);
    
    // Only call onChange if there are non-empty items to save
    // This prevents unnecessary parent updates when just adding empty items
    if (filteredItems.length > 0) {
      const next = { ...recipe };
      // Store in top-level miseEnPlace field, not in stacks
      const nextWithMiseEnPlace = next as SoustackLiteRecipe & {
        miseEnPlace?: Array<{ text: string }>;
      };
      nextWithMiseEnPlace.miseEnPlace = filteredItems;
      onChange(next);
    }
  };

  // Show placeholder when capability is not enabled
  if (!isEnabled) {
    return (
      <div style={{ marginBottom: '32px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '12px',
          }}
        >
          Mise en Place
        </label>
        <InlineStackToggle
          recipe={recipe}
          onChange={onChange}
          stackKey="prep"
          label="Add Prep Steps"
          variant="placeholder"
        />
      </div>
    );
  }

  // Full section when enabled
  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingLeft: isEnabled ? '12px' : '0',
          borderLeft: isEnabled ? '3px solid var(--cap-prep)' : 'none',
          backgroundColor: isEnabled ? 'var(--cap-prep-bg)' : 'transparent',
          paddingTop: isEnabled ? '8px' : '0',
          paddingBottom: isEnabled ? '8px' : '0',
          borderRadius: isEnabled ? '4px' : '0',
        }}
      >
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Mise en Place
        </label>
        <button
          onClick={handleAddItem}
          style={{
            padding: '6px 12px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          + Add item
        </button>
      </div>
          {items.length === 0 ? (
            <div
                style={{
                  padding: '16px',
                  border: '1px dashed #d0d0d0',
                  borderRadius: '4px',
                  backgroundColor: '#fafafa',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '14px',
                }}
              >
                No preparation steps yet. Click &quot;+ Add item&quot; to get started.
              </div>
          ) : (
            <>
              {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px',
              alignItems: 'flex-start',
            }}
          >
            {/* Checkbox indicator (visual only, not functional) */}
            <div
              style={{
                marginTop: '10px',
                width: '18px',
                height: '18px',
                border: '2px solid #d0d0d0',
                borderRadius: '3px',
                flexShrink: 0,
              }}
            />
            {/* Text input */}
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleItemChange(idx, e.target.value)}
              placeholder="Preparation step..."
              ref={(input) => {
                // Store input ref in Map for useLayoutEffect to access
                if (input) {
                  inputRefsRef.current.set(idx, input);
                } else {
                  inputRefsRef.current.delete(idx);
                }
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            {/* Order controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                onClick={() => handleMoveUp(idx)}
                disabled={idx === 0}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: '#fff',
                  cursor: idx === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: idx === 0 ? 0.5 : 1,
                  lineHeight: 1,
                }}
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => handleMoveDown(idx)}
                disabled={idx === items.length - 1}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d0d0d0',
                  borderTop: 'none',
                  borderRadius: '0 0 3px 3px',
                  backgroundColor: '#fff',
                  cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: idx === items.length - 1 ? 0.5 : 1,
                  lineHeight: 1,
                }}
                title="Move down"
              >
                ↓
              </button>
            </div>
            {/* Remove button */}
            <button
              onClick={() => handleRemoveItem(idx)}
              style={{
                padding: '8px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                alignSelf: 'flex-start',
              }}
            >
              Remove
            </button>
          </div>
              ))}
        </>
      )}
    </div>
  );
}

