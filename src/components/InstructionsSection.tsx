'use client';

import { useState, useEffect } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { isStackEnabled } from '@/lib/mise/stacks';
import { InlineStackToggle } from './CapabilitiesPanel';

// Types for instruction structures
type InstructionString = string;

type InstructionObject = {
  id?: string;
  text: string;
  timing?: {
    activity?: 'active' | 'passive';
    duration?: { minutes: number } | { minMinutes: number; maxMinutes: number };
    completionCue?: string;
    [key: string]: unknown;
  };
  inputs?: string[]; // Array of ingredient IDs (as strings)
  [key: string]: unknown; // Allow other fields
};

type InstructionItem = InstructionString | InstructionObject;

type InstructionsSectionProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
};

/**
 * Instructions section component
 * - Supports flat lists (strings) - default
 * - Supports structured objects (with id, text) when structured stack enabled
 * - Supports timing controls when timed stack enabled
 * - Supports referenced inputs when referenced stack enabled
 * - Preserves unknown fields
 * - Never throws, never deletes user content
 */
export default function InstructionsSection({
  recipe,
  onChange,
}: InstructionsSectionProps) {
  const hasStructured = isStackEnabled(recipe.stacks, 'structured');
  const hasTimed = isStackEnabled(recipe.stacks, 'timed');
  const hasReferenced = isStackEnabled(recipe.stacks, 'referenced');

  // Parse instructions array into structured items
  const parseInstructions = (): InstructionItem[] => {
    if (!Array.isArray(recipe.instructions)) return [];
    return recipe.instructions
      .filter((item) => {
        // Filter out placeholder text
        const str = typeof item === 'string' ? item : typeof item === 'object' && item !== null && 'text' in item ? String(item.text) : String(item);
        return str !== '(not provided)' && str.trim() !== '';
      })
      .map((item): InstructionItem => {
        // Type guard: if it's a string, return as-is
        if (typeof item === 'string') {
          return item;
        }
        // If it's an object, treat as structured object
        if (typeof item === 'object' && item !== null) {
          return item as InstructionObject;
        }
        // Fallback: convert to string
        return String(item);
      });
  };

  const [items, setItems] = useState<InstructionItem[]>(parseInstructions());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync items when recipe changes externally
  useEffect(() => {
    const currentItems = parseInstructions();
    setItems(currentItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.instructions]);

  // Update recipe with new instructions
  const updateInstructions = (newItems: InstructionItem[]) => {
    setItems(newItems);
    const next = { ...recipe };
    // Ensure we always have at least one item
    const filtered = newItems.filter((item) => {
      if (typeof item === 'string') {
        return item.trim().length > 0;
      }
      if (typeof item === 'object' && item !== null) {
        if ('text' in item) {
          const objItem = item as InstructionObject;
          return objItem.text.trim().length > 0;
        }
      }
      return false;
    });
    next.instructions = filtered.length > 0 ? filtered : ['(not provided)'];
    onChange(next);
  };

  // Add a simple string instruction
  const handleAddString = () => {
    const newItems = [...items, ''];
    updateInstructions(newItems);
  };

  // Add a structured instruction object
  const handleAddStructured = () => {
    const newItems = [...items, { text: '', id: `step-${Date.now()}` }];
    updateInstructions(newItems);
  };

  // Remove an item
  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateInstructions(newItems);
  };

  // Update a string instruction
  const handleStringChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value || '';
    updateInstructions(newItems);
  };

  // Update a structured instruction
  const handleStructuredChange = (
    index: number,
    field: keyof InstructionObject,
    value: unknown
  ) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as InstructionObject;
      // Ensure string fields default to empty string
      const normalizedValue = typeof value === 'string' ? (value || '') : value;
      newItems[index] = {
        ...currentObj,
        [field]: normalizedValue,
      } as InstructionObject;
      updateInstructions(newItems);
    }
  };

  // Update timing field
  const handleTimingChange = (
    index: number,
    field: keyof InstructionObject['timing'],
    value: unknown
  ) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as InstructionObject;
      const currentTiming = currentObj.timing || {};
      newItems[index] = {
        ...currentObj,
        timing: {
          ...currentTiming,
          [field]: value,
        },
      } as InstructionObject;
      updateInstructions(newItems);
    }
  };

  // Update duration type
  const handleDurationTypeChange = (index: number, type: 'exact' | 'range') => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as InstructionObject;
      const currentTiming = currentObj.timing || {};
      if (type === 'exact') {
        newItems[index] = {
          ...currentObj,
          timing: {
            ...currentTiming,
            duration: { minutes: 0 },
          },
        } as InstructionObject;
      } else {
        newItems[index] = {
          ...currentObj,
          timing: {
            ...currentTiming,
            duration: { minMinutes: 0, maxMinutes: 0 },
          },
        } as InstructionObject;
      }
      updateInstructions(newItems);
    }
  };

  // Update duration value
  const handleDurationValueChange = (index: number, field: 'minutes' | 'minMinutes' | 'maxMinutes', value: number) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as InstructionObject;
      const currentTiming = currentObj.timing || {};
      const currentDuration = currentTiming.duration || {};
      newItems[index] = {
        ...currentObj,
        timing: {
          ...currentTiming,
          duration: {
            ...currentDuration,
            [field]: value,
          },
        },
      } as InstructionObject;
      updateInstructions(newItems);
    }
  };

  // Add input reference
  const handleAddInput = (index: number) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as InstructionObject;
      const currentInputs = currentObj.inputs || [];
      newItems[index] = {
        ...currentObj,
        inputs: [...currentInputs, ''],
      } as InstructionObject;
      updateInstructions(newItems);
    }
  };

  // Update input reference
  const handleInputChange = (index: number, inputIndex: number, value: string) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as InstructionObject;
      const currentInputs = [...(currentObj.inputs || [])];
      currentInputs[inputIndex] = value || '';
      newItems[index] = {
        ...currentObj,
        inputs: currentInputs,
      } as InstructionObject;
      updateInstructions(newItems);
    }
  };

  // Remove input reference
  const handleRemoveInput = (index: number, inputIndex: number) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null) {
      const currentObj = current as InstructionObject;
      const currentInputs = (currentObj.inputs || []).filter((_, i) => i !== inputIndex);
      newItems[index] = {
        ...currentObj,
        inputs: currentInputs,
      } as InstructionObject;
      updateInstructions(newItems);
    }
  };

  // Check if item is a string
  const isString = (item: InstructionItem): item is InstructionString => {
    return typeof item === 'string';
  };

  // Check if item is a structured object
  const isStructured = (item: InstructionItem): item is InstructionObject => {
    return typeof item === 'object' && item !== null;
  };

  // Handle drag start
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
      updateInstructions(newItems);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Render a string instruction
  const renderStringInstruction = (item: InstructionString, index: number) => {
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
          gap: '8px',
          marginBottom: '8px',
          alignItems: 'flex-start',
          opacity: isDragging ? 0.5 : 1,
          borderTop: isDragOver ? '2px solid #007bff' : '2px solid transparent',
          paddingTop: isDragOver ? '6px' : '0px',
          transition: 'border-color 0.2s ease, padding 0.2s ease',
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Drag handle */}
        <div
          style={{
            cursor: 'grab',
            padding: '8px 4px',
            color: showActions ? '#666' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s ease',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '18px', userSelect: 'none' }}>⋮⋮</span>
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            value={item || ''}
            onChange={(e) => handleStringChange(index, e.target.value || '')}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            placeholder="Step instruction"
            rows={2}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: showActions ? '1px solid #d0d0d0' : '1px solid transparent',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              backgroundColor: 'transparent',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
        </div>
        {showActions && (
          <button
            onClick={() => handleRemove(index)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              alignSelf: 'flex-start',
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

  // Render a structured instruction
  const renderStructuredInstruction = (item: InstructionObject, index: number) => {
    const durationType = item.timing?.duration && 'minutes' in item.timing.duration ? 'exact' : 'range';
    const duration = item.timing?.duration || (durationType === 'exact' ? { minutes: 0 } : { minMinutes: 0, maxMinutes: 0 });
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
          marginBottom: '16px',
          padding: '16px',
          border: showActions ? '1px solid #e0e0e0' : '1px solid transparent',
          borderRadius: '4px',
          backgroundColor: showActions ? '#fafafa' : 'transparent',
          opacity: isDragging ? 0.5 : 1,
          borderTop: isDragOver ? '2px solid #007bff' : '2px solid transparent',
          paddingTop: isDragOver ? '14px' : '16px',
          transition: 'border-color 0.2s ease, background-color 0.2s ease, padding 0.2s ease',
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Drag handle and text input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
          <div
            style={{
              cursor: 'grab',
              padding: '8px 4px',
              color: showActions ? '#666' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: '18px', userSelect: 'none' }}>⋮⋮</span>
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              value={item.text || ''}
              onChange={(e) => handleStructuredChange(index, 'text', e.target.value || '')}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              placeholder="Step instruction"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: showActions ? '1px solid #d0d0d0' : '1px solid transparent',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: 'transparent',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Timing controls (when timed stack enabled) */}
        {hasTimed && showActions && (
          <div
            style={{
              marginBottom: '12px',
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fff',
            }}
          >
            <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#666' }}>
              Timing (optional)
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Activity type */}
              <select
                value={item.timing?.activity || ''}
                onChange={(e) => handleTimingChange(index, 'activity', e.target.value || undefined)}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="">Activity type</option>
                <option value="active">Active</option>
                <option value="passive">Passive</option>
              </select>

              {/* Duration type */}
              <select
                value={durationType}
                onChange={(e) => handleDurationTypeChange(index, e.target.value as 'exact' | 'range')}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="exact">Exact duration</option>
                <option value="range">Duration range</option>
              </select>

              {/* Duration inputs */}
              {durationType === 'exact' && 'minutes' in duration && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    value={duration.minutes || 0}
                    onChange={(e) => handleDurationValueChange(index, 'minutes', Number(e.target.value))}
                    min="0"
                    step="0.5"
                    placeholder="Minutes"
                    style={{
                      width: '80px',
                      padding: '6px 10px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#666' }}>min</span>
                </div>
              )}

              {durationType === 'range' && ('minMinutes' in duration || 'maxMinutes' in duration) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    value={'minMinutes' in duration ? duration.minMinutes || 0 : 0}
                    onChange={(e) => handleDurationValueChange(index, 'minMinutes', Number(e.target.value))}
                    min="0"
                    step="0.5"
                    placeholder="Min"
                    style={{
                      width: '70px',
                      padding: '6px 10px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#666' }}>-</span>
                  <input
                    type="number"
                    value={'maxMinutes' in duration ? duration.maxMinutes || 0 : 0}
                    onChange={(e) => handleDurationValueChange(index, 'maxMinutes', Number(e.target.value))}
                    min="0"
                    step="0.5"
                    placeholder="Max"
                    style={{
                      width: '70px',
                      padding: '6px 10px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#666' }}>min</span>
                </div>
              )}

              {/* Completion cue */}
              <input
                type="text"
                value={item.timing?.completionCue || ''}
                onChange={(e) => handleTimingChange(index, 'completionCue', e.target.value || undefined)}
                placeholder="Completion cue (optional)"
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '6px 10px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        )}

        {/* Referenced inputs (when referenced stack enabled) */}
        {hasReferenced && showActions && (
          <div
            style={{
              marginBottom: '12px',
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#666' }}>
                Inputs (optional)
              </div>
              <button
                onClick={() => handleAddInput(index)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                + Add input
              </button>
            </div>
            {item.inputs && item.inputs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {item.inputs.map((inputId, inputIdx) => (
                  <div key={inputIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={inputId || ''}
                      onChange={(e) => handleInputChange(index, inputIdx, e.target.value || '')}
                      placeholder="Ingredient ID"
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      onClick={() => handleRemoveInput(index, inputIdx)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                No inputs referenced
              </div>
            )}
          </div>
        )}

        {/* Remove button */}
        {showActions && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleRemove(index)}
              style={{
                padding: '8px 16px',
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
          </div>
        )}
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
        }}
      >
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Instructions
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAddString}
            style={{
              padding: '6px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            + String
          </button>
          {hasStructured && (
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
          )}
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
          No instructions yet. Add a string or structured step.
        </div>
      ) : (
        items.map((item, idx) => {
          if (isString(item)) {
            return renderStringInstruction(item, idx);
          } else if (isStructured(item)) {
            return renderStructuredInstruction(item, idx);
          }
          return null;
        })
      )}
      {/* Inline suggestion for storage stack */}
      {!isStackEnabled(recipe.stacks, 'storage') && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px dashed #e0e0e0',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <InlineStackToggle
            recipe={recipe}
            onChange={onChange}
            stackKey="storage"
            label="Add Storage Info"
            variant="button"
          />
        </div>
      )}
    </div>
  );
}

