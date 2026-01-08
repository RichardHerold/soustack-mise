'use client';

import { useState, useEffect, useRef } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { isStackEnabled } from '@/lib/mise/stacks';

// Types for ingredient structures
type IngredientString = string;

type IngredientObject = {
  quantity?: string | number;
  unit?: string;
  name: string;
  scaling?: {
    mode?: 'toTaste' | 'fixed' | 'proportional';
    [key: string]: unknown;
  };
  [key: string]: unknown; // Allow other fields
};

type IngredientSection = {
  section: {
    name: string;
    items: IngredientItem[];
  };
};

type IngredientItem = IngredientString | IngredientObject | IngredientSection;

type IngredientsSectionProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
};

/**
 * Ingredients section component
 * - Supports flat lists (strings)
 * - Supports structured objects (with quantity, unit, name)
 * - Supports nested sections/groups
 * - Inline quantity editing
 * - Scaling UI when scaling capability is enabled (recipe.stacks['scaling'])
 */
export default function IngredientsSection({
  recipe,
  onChange,
}: IngredientsSectionProps) {
  // Check for scaling capability declaration (not scaling@1 content)
  const hasScaling = isStackEnabled(recipe.stacks, 'scaling');

  // Parse ingredients array into structured items
  const parseIngredients = (): IngredientItem[] => {
    if (!Array.isArray(recipe.ingredients)) return [];
    return recipe.ingredients
      .filter((item) => {
        // Filter out placeholder text
        const str = String(item);
        return str !== '(not provided)' && str.trim() !== '';
      })
      .map((item): IngredientItem => {
        // Type guard: if it's a string, return as-is
        if (typeof item === 'string') {
          return item;
        }
        // If it's an object, check if it's a section
        if (typeof item === 'object' && item !== null) {
          if ('section' in item && typeof item.section === 'object' && item.section !== null) {
            return item as IngredientSection;
          }
          // Otherwise treat as structured object
          return item as IngredientObject;
        }
        // Fallback: convert to string
        return String(item);
      });
  };

  const [items, setItems] = useState<IngredientItem[]>(parseIngredients());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredSectionItem, setHoveredSectionItem] = useState<string | null>(null);
  const [focusedSectionItem, setFocusedSectionItem] = useState<string | null>(null);
  const [autoFocusIndex, setAutoFocusIndex] = useState<number | null>(null);
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const isInternalUpdateRef = useRef(false);

  // Sync items when recipe changes externally
  useEffect(() => {
    // Skip sync if we're in the middle of an internal update
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    const currentItems = parseIngredients();
    // Only sync if items actually changed (to avoid clearing focus during typing)
    const itemsChanged = JSON.stringify(currentItems) !== JSON.stringify(items);
    if (itemsChanged) {
      setItems(currentItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.ingredients]);

  // Auto-focus newly added inputs
  useEffect(() => {
    if (autoFocusIndex !== null) {
      const input = inputRefs.current[autoFocusIndex];
      if (input) {
        input.focus();
        setFocusedIndex(autoFocusIndex);
        setAutoFocusIndex(null);
      }
    }
  }, [autoFocusIndex]);

  // Update recipe with new ingredients
  const updateIngredients = (newItems: IngredientItem[]) => {
    isInternalUpdateRef.current = true;
    setItems(newItems);
    const next = { ...recipe };
    // Ensure we always have at least one item
    const filtered = newItems.filter((item) => {
      if (typeof item === 'string') {
        return item.trim().length > 0;
      }
      if (typeof item === 'object' && item !== null) {
        if ('section' in item) {
          const sectionItem = item as IngredientSection;
          return sectionItem.section.name.trim().length > 0 || sectionItem.section.items.length > 0;
        }
        if ('name' in item) {
          const objItem = item as IngredientObject;
          return objItem.name.trim().length > 0;
        }
      }
      return false;
    });
    next.ingredients = filtered.length > 0 ? filtered : ['(not provided)'];
    onChange(next);
  };

  // Add a simple string ingredient at the end
  const handleAddString = () => {
    const newItems = [...items, ''];
    const newIndex = newItems.length - 1;
    updateIngredients(newItems);
    setAutoFocusIndex(newIndex);
  };

  // Add a simple string ingredient after a specific index
  const handleAddStringAfter = (afterIndex: number) => {
    const newItems = [...items];
    newItems.splice(afterIndex + 1, 0, '');
    const newIndex = afterIndex + 1;
    updateIngredients(newItems);
    setAutoFocusIndex(newIndex);
  };

  // Add a structured ingredient object at the end
  const handleAddStructured = () => {
    const newItems = [...items, { name: '', quantity: '', unit: '' }];
    updateIngredients(newItems);
  };

  // Add a structured ingredient after a specific index
  const handleAddStructuredAfter = (afterIndex: number) => {
    const newItems = [...items];
    newItems.splice(afterIndex + 1, 0, { name: '', quantity: '', unit: '' });
    updateIngredients(newItems);
  };

  // Add a section/group
  const handleAddSection = () => {
    const newItems = [...items, { section: { name: '', items: [] } }];
    updateIngredients(newItems);
  };

  // Remove an item
  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateIngredients(newItems);
  };

  // Update a string ingredient
  const handleStringChange = (index: number, value: string) => {
    // Preserve focus state - if this input is focused, keep it focused after update
    const wasFocused = focusedIndex === index;
    const newItems = [...items];
    newItems[index] = value || '';
    updateIngredients(newItems);
    // Restore focus state if it was focused
    if (wasFocused) {
      setFocusedIndex(index);
    }
  };

  // Update a structured ingredient
  const handleStructuredChange = (
    index: number,
    field: keyof IngredientObject,
    value: string | number | { mode?: string; [key: string]: unknown }
  ) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null && !('section' in current)) {
      const currentObj = current as IngredientObject;
      // Ensure string fields default to empty string
      const normalizedValue = typeof value === 'string' ? (value || '') : value;
      newItems[index] = {
        ...currentObj,
        [field]: normalizedValue,
      } as IngredientObject;
      updateIngredients(newItems);
    }
  };

  // Update a section name
  const handleSectionNameChange = (index: number, name: string) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as IngredientSection;
      newItems[index] = {
        section: {
          ...currentSection.section,
          name: name || '',
        },
      } as IngredientSection;
      updateIngredients(newItems);
    }
  };

  // Add item to a section
  const handleAddToSection = (sectionIndex: number, asString: boolean) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as IngredientSection;
      const newSectionItem: IngredientItem = asString ? '' : { name: '', quantity: '', unit: '' };
      newItems[sectionIndex] = {
        section: {
          ...currentSection.section,
          items: [...currentSection.section.items, newSectionItem],
        },
      } as IngredientSection;
      updateIngredients(newItems);
    }
  };

  // Update item in a section
  const handleSectionItemChange = (
    sectionIndex: number,
    itemIndex: number,
    value: IngredientItem
  ) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as IngredientSection;
      const sectionItems = [...currentSection.section.items];
      // Ensure string values default to empty string
      const normalizedValue = typeof value === 'string' ? (value || '') : value;
      sectionItems[itemIndex] = normalizedValue;
      newItems[sectionIndex] = {
        section: {
          ...currentSection.section,
          items: sectionItems,
        },
      } as IngredientSection;
      updateIngredients(newItems);
    }
  };

  // Remove item from a section
  const handleRemoveFromSection = (sectionIndex: number, itemIndex: number) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as IngredientSection;
      const sectionItems = currentSection.section.items.filter((_: IngredientItem, i: number) => i !== itemIndex);
      newItems[sectionIndex] = {
        section: {
          ...currentSection.section,
          items: sectionItems,
        },
      } as IngredientSection;
      updateIngredients(newItems);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newItems = [...items];
      const draggedItem = newItems[draggedIndex];
      newItems.splice(draggedIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);
      updateIngredients(newItems);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Check if item is a string
  const isString = (item: IngredientItem): item is IngredientString => {
    return typeof item === 'string';
  };

  // Check if item is a structured object
  const isStructured = (item: IngredientItem): item is IngredientObject => {
    return (
      typeof item === 'object' &&
      item !== null &&
      !('section' in item) &&
      'name' in item
    );
  };

  // Check if item is a section
  const isSection = (item: IngredientItem): item is IngredientSection => {
    return typeof item === 'object' && item !== null && 'section' in item;
  };

  // Render a string ingredient
  const renderStringIngredient = (item: IngredientString, index: number) => {
    const showActions = hoveredIndex === index || focusedIndex === index;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;

    return (
      <div
        key={index}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        style={{
          display: 'flex',
          gap: '0px',
          marginBottom: '4px',
          alignItems: 'center',
          opacity: isDragging ? 0.5 : 1,
          borderTop: isDragOver ? '2px solid #007bff' : '2px solid transparent',
          paddingTop: isDragOver ? '6px' : '0px',
          transition: 'border-color 0.2s ease, padding 0.2s ease',
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Plus button - Notion style */}
        <button
          onClick={() => handleAddStringAfter(index)}
          style={{
            width: '24px',
            height: '24px',
            padding: 0,
            margin: 0,
            marginTop: '2px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: showActions ? 1 : 0,
            transition: 'opacity 0.2s ease',
            color: 'var(--color-text-muted)',
            fontSize: '20px',
            lineHeight: '1',
            fontWeight: '300',
          }}
          title="Add ingredient"
        >
          +
        </button>
        {/* Drag handle */}
        <div
          style={{
            cursor: 'grab',
            padding: '8px 0px 8px 0px',
            margin: 0,
            color: showActions ? 'var(--color-text-muted)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s ease',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '18px', userSelect: 'none' }}>⋮⋮</span>
        </div>
        <div style={{ flex: 1 }}>
          <input
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          value={item || ''}
          onChange={(e) => handleStringChange(index, e.target.value || '')}
          onFocus={() => setFocusedIndex(index)}
          onBlur={(e) => {
            // Don't clear focus if clicking a button
            if (e.relatedTarget && (e.relatedTarget as HTMLElement).tagName === 'BUTTON') {
              return;
            }
            setFocusedIndex(null);
          }}
          placeholder="Ingredient (e.g., 2 cups flour)"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: showActions ? '1px solid #d0d0d0' : '1px solid transparent',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'transparent',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
        />
        </div>
        {showActions && (
          <button
            onClick={() => handleRemove(index)}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '8px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              opacity: showActions ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            Remove
          </button>
        )}
      </div>
    );
  };

  // Render a structured ingredient
  const renderStructuredIngredient = (item: IngredientObject, index: number) => {
    const showActions = hoveredIndex === index || focusedIndex === index;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;

    return (
      <div
        key={index}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        style={{
          display: 'flex',
          gap: '0px',
          marginBottom: '4px',
          alignItems: 'center',
          flexWrap: 'wrap',
          opacity: isDragging ? 0.5 : 1,
          borderTop: isDragOver ? '2px solid #007bff' : '2px solid transparent',
          paddingTop: isDragOver ? '6px' : '0px',
          transition: 'border-color 0.2s ease, padding 0.2s ease',
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Plus button - Notion style */}
        <button
          onClick={() => handleAddStructuredAfter(index)}
          style={{
            width: '24px',
            height: '24px',
            padding: 0,
            margin: 0,
            marginTop: '2px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: showActions ? 1 : 0,
            transition: 'opacity 0.2s ease',
            color: 'var(--color-text-muted)',
            fontSize: '20px',
            lineHeight: '1',
            fontWeight: '300',
          }}
          title="Add ingredient"
        >
          +
        </button>
        {/* Drag handle */}
        <div
          style={{
            cursor: 'grab',
            padding: '8px 0px 8px 0px',
            margin: 0,
            color: showActions ? 'var(--color-text-muted)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s ease',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '18px', userSelect: 'none' }}>⋮⋮</span>
        </div>
        {/* Quantity */}
        <input
          type="text"
          value={item.quantity || ''}
          onChange={(e) => handleStructuredChange(index, 'quantity', e.target.value || '')}
          onFocus={() => setFocusedIndex(index)}
          onBlur={(e) => {
            if (e.relatedTarget && (e.relatedTarget as HTMLElement).tagName === 'BUTTON') {
              return;
            }
            setFocusedIndex(null);
          }}
          placeholder="Qty"
          style={{
            width: '80px',
            padding: '8px 12px',
            border: showActions ? '1px solid #d0d0d0' : '1px solid transparent',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'transparent',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
        />
        {/* Unit */}
        <input
          type="text"
          value={item.unit || ''}
          onChange={(e) => handleStructuredChange(index, 'unit', e.target.value || '')}
          onFocus={() => setFocusedIndex(index)}
          onBlur={(e) => {
            if (e.relatedTarget && (e.relatedTarget as HTMLElement).tagName === 'BUTTON') {
              return;
            }
            setFocusedIndex(null);
          }}
          placeholder="Unit"
          style={{
            width: '100px',
            padding: '8px 12px',
            border: showActions ? '1px solid #d0d0d0' : '1px solid transparent',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'transparent',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
        />
        {/* Name */}
        <input
          type="text"
          value={item.name || ''}
          onChange={(e) => handleStructuredChange(index, 'name', e.target.value || '')}
          onFocus={() => setFocusedIndex(index)}
          onBlur={(e) => {
            if (e.relatedTarget && (e.relatedTarget as HTMLElement).tagName === 'BUTTON') {
              return;
            }
            setFocusedIndex(null);
          }}
          placeholder="Ingredient name"
          style={{
            flex: 1,
            minWidth: '150px',
            padding: '8px 12px',
            border: showActions ? '1px solid #d0d0d0' : '1px solid transparent',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'transparent',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
        />
        {/* Scaling UI (only when scaling capability enabled) */}
        {hasScaling && (
          <select
            value={item.scaling?.mode || 'proportional'}
            onChange={(e) =>
              handleStructuredChange(index, 'scaling', {
                mode: e.target.value as 'toTaste' | 'fixed' | 'proportional',
              })
            }
            style={{
              padding: '8px 12px',
              border: showActions ? '1px solid #d0d0d0' : '1px solid transparent',
              borderRadius: '4px',
              fontSize: '13px',
              backgroundColor: showActions ? '#fff' : 'transparent',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
          >
            <option value="proportional">Proportional</option>
            <option value="toTaste">To taste</option>
            <option value="fixed">Fixed</option>
          </select>
        )}
        {showActions && (
          <button
            onClick={() => handleRemove(index)}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '8px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              opacity: showActions ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            Remove
          </button>
        )}
      </div>
    );
  };

  // Render a section
  const renderSection = (item: IngredientSection, index: number) => {
    const sectionHovered = hoveredIndex === index;
    const sectionFocused = focusedIndex === index;
    const showSectionActions = sectionHovered || sectionFocused;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;

    return (
      <div
        key={index}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        style={{
          marginBottom: '16px',
          padding: '16px',
          border: showSectionActions ? '1px solid #e0e0e0' : '1px solid transparent',
          borderRadius: '4px',
          backgroundColor: showSectionActions ? '#fafafa' : 'transparent',
          opacity: isDragging ? 0.5 : 1,
          borderTop: isDragOver ? '2px solid #007bff' : '2px solid transparent',
          paddingTop: isDragOver ? '14px' : '16px',
          transition: 'border-color 0.2s ease, background-color 0.2s ease, padding 0.2s ease',
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <input
            type="text"
            value={item.section.name || ''}
            onChange={(e) => handleSectionNameChange(index, e.target.value || '')}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            placeholder="Section name (e.g., For the sauce)"
            style={{
              flex: 1,
              padding: '10px 14px',
              border: showSectionActions ? '1px solid #d0d0d0' : '1px solid transparent',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 550,
              backgroundColor: hasScaling ? 'rgba(139, 92, 246, 0.025)' : 'transparent',
              outline: 'none',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
          />
          {showSectionActions && (
            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
              <button
                onClick={() => handleAddToSection(index, true)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                + String
              </button>
              <button
                onClick={() => handleAddToSection(index, false)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                + Structured
              </button>
              <button
                onClick={() => handleRemove(index)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        {/* Section items */}
        <div style={{ paddingLeft: '16px' }}>
          {item.section.items.length === 0 ? (
            <div
              style={{
                padding: '12px',
                color: '#999',
                fontSize: '13px',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              No items in this section yet
            </div>
          ) : (
            item.section.items.map((sectionItem, itemIdx) => {
              const itemKey = `${index}-${itemIdx}`;
              const itemHovered = hoveredSectionItem === itemKey;
              const itemFocused = focusedSectionItem === itemKey;
              const showItemActions = itemHovered || itemFocused;

              return (
                <div
                  key={itemIdx}
                  style={{ marginBottom: '8px' }}
                  onMouseEnter={() => setHoveredSectionItem(itemKey)}
                  onMouseLeave={() => setHoveredSectionItem(null)}
                >
                  {isString(sectionItem) ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={sectionItem || ''}
                        onChange={(e) =>
                          handleSectionItemChange(index, itemIdx, e.target.value || '')
                        }
                        onFocus={() => setFocusedSectionItem(itemKey)}
                        onBlur={() => setFocusedSectionItem(null)}
                        placeholder="Ingredient"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: showItemActions ? '1px solid #d0d0d0' : '1px solid transparent',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'transparent',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                      />
                      {showItemActions && (
                        <button
                          onClick={() => handleRemoveFromSection(index, itemIdx)}
                          style={{
                            padding: '8px 16px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : isStructured(sectionItem) ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={sectionItem.quantity || ''}
                        onChange={(e) =>
                          handleSectionItemChange(index, itemIdx, {
                            ...sectionItem,
                            quantity: e.target.value || '',
                          })
                        }
                        onFocus={() => setFocusedSectionItem(itemKey)}
                        onBlur={() => setFocusedSectionItem(null)}
                        placeholder="Qty"
                        style={{
                          width: '80px',
                          padding: '8px 12px',
                          border: showItemActions ? '1px solid #d0d0d0' : '1px solid transparent',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'transparent',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                      />
                      <input
                        type="text"
                        value={sectionItem.unit || ''}
                        onChange={(e) =>
                          handleSectionItemChange(index, itemIdx, {
                            ...sectionItem,
                            unit: e.target.value || '',
                          })
                        }
                        onFocus={() => setFocusedSectionItem(itemKey)}
                        onBlur={() => setFocusedSectionItem(null)}
                        placeholder="Unit"
                        style={{
                          width: '100px',
                          padding: '8px 12px',
                          border: showItemActions ? '1px solid #d0d0d0' : '1px solid transparent',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'transparent',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                      />
                      <input
                        type="text"
                        value={sectionItem.name || ''}
                        onChange={(e) =>
                          handleSectionItemChange(index, itemIdx, {
                            ...sectionItem,
                            name: e.target.value || '',
                          })
                        }
                        onFocus={() => setFocusedSectionItem(itemKey)}
                        onBlur={() => setFocusedSectionItem(null)}
                        placeholder="Name"
                        style={{
                          flex: 1,
                          minWidth: '150px',
                          padding: '8px 12px',
                          border: showItemActions ? '1px solid #d0d0d0' : '1px solid transparent',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'transparent',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                      />
                      {hasScaling && (
                        <select
                          value={sectionItem.scaling?.mode || 'proportional'}
                          onChange={(e) =>
                            handleSectionItemChange(index, itemIdx, {
                              ...sectionItem,
                              scaling: {
                                mode: e.target.value as 'toTaste' | 'fixed' | 'proportional',
                              },
                            })
                          }
                          style={{
                            padding: '8px 12px',
                            border: showItemActions ? '1px solid #d0d0d0' : '1px solid transparent',
                            borderRadius: '4px',
                            fontSize: '13px',
                            backgroundColor: showItemActions ? '#fff' : 'transparent',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s ease, background-color 0.2s ease',
                          }}
                        >
                          <option value="proportional">Proportional</option>
                          <option value="toTaste">To taste</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      )}
                      {showItemActions && (
                        <button
                          onClick={() => handleRemoveFromSection(index, itemIdx)}
                          style={{
                            padding: '8px 16px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingLeft: hasScaling ? '12px' : '0',
          borderLeft: hasScaling ? '3px solid var(--cap-scaling)' : 'none',
          backgroundColor: hasScaling ? 'var(--cap-scaling-bg)' : 'transparent',
          paddingTop: hasScaling ? '8px' : '0',
          paddingBottom: hasScaling ? '8px' : '0',
          borderRadius: hasScaling ? '4px' : '0',
        }}
      >
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Ingredients
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAddStructured}
            style={{
              padding: '6px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            + Structured
          </button>
          <button
            onClick={handleAddSection}
            style={{
              padding: '6px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            + Section
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
          <button
            onClick={handleAddString}
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            + Add first ingredient
          </button>
        </div>
      ) : (
        <>
          {items.map((item, idx) => {
            if (isString(item)) {
              return renderStringIngredient(item, idx);
            } else if (isStructured(item)) {
              return renderStructuredIngredient(item, idx);
            } else if (isSection(item)) {
              return renderSection(item, idx);
            }
            return null;
          })}
          {/* Add button at the end */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              marginTop: '4px',
              alignItems: 'center',
            }}
            onMouseEnter={() => setHoveredIndex(items.length)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <button
              onClick={handleAddString}
              style={{
                width: '20px',
                height: '20px',
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: hoveredIndex === items.length ? 1 : 0.3,
                transition: 'opacity 0.2s ease',
                color: '#666',
                fontSize: '16px',
                lineHeight: '1',
              }}
              title="Add ingredient"
            >
              +
            </button>
            <div style={{ flex: 1, padding: '8px 12px', color: '#999', fontSize: '13px' }}>
              Add ingredient
            </div>
          </div>
        </>
      )}
    </div>
  );
}

