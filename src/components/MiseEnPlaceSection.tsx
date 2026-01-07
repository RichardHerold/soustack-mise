'use client';

import { useState, useEffect, useRef } from 'react';
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

  // Sync items when recipe changes externally
  // Merge empty items from local state with non-empty items from recipe
  // This preserves empty items being edited while syncing saved items
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:54',message:'useEffect triggered',data:{isInternalUpdate:isInternalUpdateRef.current,currentItemsCount:items.length,recipeMiseEnPlace:(recipe as SoustackLiteRecipe & { miseEnPlace?: Array<{ text: string }> }).miseEnPlace,isEnabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Skip sync if we're the ones making the change (prevents race condition)
    if (isInternalUpdateRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:60',message:'useEffect sync skipped (internal update)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      isInternalUpdateRef.current = false;
      return;
    }
    const currentItems = getMiseEnPlaceItems();
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:66',message:'useEffect syncing',data:{currentItemsCount:currentItems.length,currentItems,localItemsCount:items.length,localItems:items},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Merge: keep empty items from local state, add/update non-empty items from recipe
    const emptyLocalItems = items.filter(item => !item.text.trim());
    const mergedItems = [...currentItems, ...emptyLocalItems];
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:72',message:'useEffect setting merged items',data:{mergedItemsCount:mergedItems.length,mergedItems,emptyLocalItemsCount:emptyLocalItems.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setItems(mergedItems);
    setIsExpanded(isEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.stacks, (recipe as SoustackLiteRecipe & { miseEnPlace?: Array<{ text: string }> }).miseEnPlace]);

  const handleItemChange = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = { text };
    updateItems(newItems);
  };

  const handleAddItem = () => {
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:75',message:'handleAddItem called',data:{currentItemsCount:items.length,currentItems:items,isEnabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const newItems = [...items, { text: '' }];
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:78',message:'Before updateItems',data:{newItemsCount:newItems.length,newItems},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:99',message:'updateItems entry',data:{newItemsCount:newItems.length,newItems,currentItemsCount:items.length,isInternalUpdateBefore:isInternalUpdateRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Mark that we're making an internal update (prevents useEffect from syncing back)
    isInternalUpdateRef.current = true;
    // Always update local state first (allows empty items for editing)
    setItems(newItems);
    const next = { ...recipe };
    // Filter out empty items only when saving to recipe
    const filteredItems = newItems.filter((item) => item.text.trim().length > 0);
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:110',message:'After filtering',data:{filteredItemsCount:filteredItems.length,filteredItems,originalCount:newItems.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Store in top-level miseEnPlace field, not in stacks
    const nextWithMiseEnPlace = next as SoustackLiteRecipe & {
      miseEnPlace?: Array<{ text: string }>;
    };
    // Only update recipe if there are non-empty items, but preserve local state with empty items
    nextWithMiseEnPlace.miseEnPlace = filteredItems.length > 0 ? filteredItems : undefined;
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:117',message:'Before onChange',data:{miseEnPlace:nextWithMiseEnPlace.miseEnPlace,hasMiseEnPlace:!!nextWithMiseEnPlace.miseEnPlace,localItemsCount:newItems.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Always call onChange to update recipe (even with empty items, so parent knows about the change)
    // The ref flag prevents useEffect from overwriting our local state
    onChange(next);
    // #region agent log
    fetch('http://127.0.0.1:7258/ingest/ddcb45e8-a288-43de-9ebe-d7d3c0bb0a3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MiseEnPlaceSection.tsx:122',message:'After onChange',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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

