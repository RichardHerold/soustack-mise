'use client';

import { useState } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type MiseEnPlaceItem = {
  text: string;
};

type MiseEnPlaceSectionProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
};

/**
 * Mise en Place section component
 * - Visible when prep@1 stack is enabled
 * - Collapsed suggestion when disabled
 * - Checklist-style free text items
 * - Orderable items
 */
export default function MiseEnPlaceSection({
  recipe,
  onChange,
}: MiseEnPlaceSectionProps) {
  const isEnabled = 'prep@1' in recipe.stacks && recipe.stacks['prep@1'] !== undefined;
  
  // Get mise en place items from stacks
  const getMiseEnPlaceItems = (): MiseEnPlaceItem[] => {
    if (!isEnabled) return [];
    const prepData = recipe.stacks['prep@1'];
    if (Array.isArray(prepData)) {
      return prepData.filter((item): item is MiseEnPlaceItem => 
        typeof item === 'object' && item !== null && 'text' in item && typeof item.text === 'string'
      );
    }
    return [];
  };

  const [items, setItems] = useState<MiseEnPlaceItem[]>(getMiseEnPlaceItems());
  const [isExpanded, setIsExpanded] = useState(isEnabled);

  // Sync items when recipe changes externally
  const currentItems = getMiseEnPlaceItems();
  if (JSON.stringify(currentItems) !== JSON.stringify(items)) {
    setItems(currentItems);
    setIsExpanded(isEnabled);
  }

  const handleToggleStack = () => {
    const next = { ...recipe };
    if (isEnabled) {
      // Disable: remove prep@1 from stacks
      const { 'prep@1': _, ...restStacks } = next.stacks;
      next.stacks = restStacks;
      setItems([]);
      setIsExpanded(false);
    } else {
      // Enable: add prep@1 to stacks with empty array
      next.stacks = {
        ...next.stacks,
        'prep@1': [],
      };
      setItems([]);
      setIsExpanded(true);
    }
    onChange(next);
  };

  const handleItemChange = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = { text };
    updateItems(newItems);
  };

  const handleAddItem = () => {
    const newItems = [...items, { text: '' }];
    updateItems(newItems);
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
    setItems(newItems);
    const next = { ...recipe };
    // Filter out empty items
    const filteredItems = newItems.filter((item) => item.text.trim().length > 0);
    next.stacks = {
      ...next.stacks,
      'prep@1': filteredItems,
    };
    onChange(next);
  };

  // Collapsed suggestion when disabled
  if (!isEnabled) {
    return (
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            padding: '12px 16px',
            border: '1px dashed #d0d0d0',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onClick={handleToggleStack}
        >
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '4px',
                color: '#666',
              }}
            >
              Mise en Place
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#999',
                fontStyle: 'italic',
              }}
            >
              Click to enable preparation steps
            </div>
          </div>
          <button
            style={{
              padding: '6px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStack();
            }}
          >
            Enable
          </button>
        </div>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
          <button
            onClick={handleToggleStack}
            style={{
              padding: '6px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#666',
            }}
          >
            Disable
          </button>
        </div>
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
          No preparation steps yet. Click "+ Add item" to get started.
        </div>
      ) : (
        items.map((item, idx) => (
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
        ))
      )}
    </div>
  );
}

