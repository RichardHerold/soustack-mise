'use client';

import { useState, useEffect, useRef } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { isStackEnabled, enableStack } from '@/lib/mise/stacks';
import { InlineStackToggle } from './CapabilitiesPanel';
import InlineHint from './creator/InlineHint';
import { shouldSuggestTimed } from './creator/hintUtils';

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

type InstructionSection = {
  section: {
    name: string;
    items: InstructionItem[];
  };
};

type InstructionItem = InstructionString | InstructionObject | InstructionSection;

type InstructionsSectionProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
  showCreatorHints?: boolean;
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
  showCreatorHints = false,
}: InstructionsSectionProps) {
  const hasStructured = isStackEnabled(recipe.stacks, 'structured');
  const hasTimed = isStackEnabled(recipe.stacks, 'timed');
  const hasReferenced = isStackEnabled(recipe.stacks, 'referenced');

  // Normalize a single instruction item to canonical editor shape
  const normalizeItem = (item: unknown): InstructionItem => {
    // String: return as-is
    if (typeof item === 'string') {
      return item;
    }
    
    // Object: check for section
    if (typeof item === 'object' && item !== null) {
      // Canonical editor shape: { section: { name, items } }
      if ('section' in item && typeof item.section === 'object' && item.section !== null) {
        const sectionData = item.section as { name?: unknown; items?: unknown };
        const normalizedSection: InstructionSection = {
          section: {
            name: typeof sectionData.name === 'string' ? sectionData.name : '',
            items: Array.isArray(sectionData.items)
              ? sectionData.items.map(normalizeItem)
              : [],
          },
        };
        return normalizedSection;
      }
      
      // Spec-style shape: { section: string, steps: [...] }
      if ('section' in item && typeof item.section === 'string' && 'steps' in item && Array.isArray(item.steps)) {
        const specItem = item as { section: string; steps: unknown[] };
        const normalizedSection: InstructionSection = {
          section: {
            name: specItem.section,
            items: specItem.steps.map(normalizeItem),
          },
        };
        return normalizedSection;
      }
      
      // Structured object (with text field)
      if ('text' in item) {
        return item as InstructionObject;
      }
      
      // Unknown object shape: try to preserve it as structured object
      // If it has a stringifiable value, use that as text
      const obj = item as Record<string, unknown>;
      if ('text' in obj) {
        return obj as InstructionObject;
      }
      // Fallback: stringify the object
      return String(item);
    }
    
    // Fallback: convert to string
    return String(item);
  };

  // Parse instructions array into structured items
  const parseInstructions = (): InstructionItem[] => {
    if (!Array.isArray(recipe.instructions)) return [];
    return recipe.instructions
      .filter((item) => {
        // Filter out placeholder text
        const str = typeof item === 'string' 
          ? item 
          : typeof item === 'object' && item !== null && 'text' in item 
            ? String(item.text) 
            : typeof item === 'object' && item !== null && 'section' in item
              ? String((item as { section?: unknown }).section || '')
              : String(item);
        return str !== '(not provided)' && str.trim() !== '';
      })
      .map(normalizeItem);
  };

  const [items, setItems] = useState<InstructionItem[]>(parseInstructions());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredSectionItem, setHoveredSectionItem] = useState<string | null>(null);
  const [focusedSectionItem, setFocusedSectionItem] = useState<string | null>(null);
  const isInternalUpdateRef = useRef(false);

  // Sync items when recipe changes externally
  useEffect(() => {
    // Skip sync if we're in the middle of an internal update
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    const currentItems = parseInstructions();
    // Only sync if items actually changed (to avoid clearing focus during typing)
    const itemsChanged = JSON.stringify(currentItems) !== JSON.stringify(items);
    if (itemsChanged) {
      setItems(currentItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.instructions]);

  // Update recipe with new instructions
  const updateInstructions = (newItems: InstructionItem[]) => {
    isInternalUpdateRef.current = true;
    setItems(newItems);
    const next = { ...recipe };
    // Ensure we always have at least one item
    const filtered = newItems.filter((item) => {
      if (typeof item === 'string') {
        return item.trim().length > 0;
      }
      if (typeof item === 'object' && item !== null) {
        // Section: keep if name or items exist
        if ('section' in item) {
          const sectionItem = item as InstructionSection;
          return sectionItem.section.name.trim().length > 0 || sectionItem.section.items.length > 0;
        }
        // Structured object: keep if text exists
        if ('text' in item) {
          const objItem = item as InstructionObject;
          return objItem.text.trim().length > 0;
        }
      }
      return false;
    });
    // Write back using canonical editor shape
    const normalized = filtered.map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (typeof item === 'object' && item !== null) {
        if ('section' in item) {
          // Already in canonical shape: { section: { name, items } }
          return item;
        }
        // Structured object: preserve as-is
        return item;
      }
      return String(item);
    });
    next.instructions = normalized.length > 0 ? normalized : ['(not provided)'];
    onChange(next);
  };

  // Add a simple string instruction at the end
  const handleAddString = () => {
    const newItems = [...items, ''];
    updateInstructions(newItems);
  };

  // Add a simple string instruction after a specific index
  const handleAddStringAfter = (afterIndex: number) => {
    const newItems = [...items];
    newItems.splice(afterIndex + 1, 0, '');
    updateInstructions(newItems);
  };

  // Add a structured instruction object
  const handleAddStructured = () => {
    const newItems = [...items, { text: '', id: `step-${Date.now()}` }];
    updateInstructions(newItems);
  };

  // Add a section
  const handleAddSection = () => {
    const newItems = [...items, { section: { name: '', items: [''] } }];
    updateInstructions(newItems);
  };

  // Remove an item
  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateInstructions(newItems);
  };

  // Update a section name
  const handleSectionNameChange = (index: number, name: string) => {
    const newItems = [...items];
    const current = newItems[index];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      newItems[index] = {
        section: {
          ...currentSection.section,
          name: name || '',
        },
      } as InstructionSection;
      updateInstructions(newItems);
    }
  };

  // Add item to a section
  const handleAddToSection = (sectionIndex: number, asString: boolean) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const newSectionItem: InstructionItem = asString ? '' : { text: '', id: `step-${Date.now()}` };
      newItems[sectionIndex] = {
        section: {
          ...currentSection.section,
          items: [...currentSection.section.items, newSectionItem],
        },
      } as InstructionSection;
      updateInstructions(newItems);
    }
  };

  // Update item in a section
  const handleSectionItemChange = (
    sectionIndex: number,
    itemIndex: number,
    value: InstructionItem
  ) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = [...currentSection.section.items];
      // Ensure string values default to empty string
      const normalizedValue = typeof value === 'string' ? (value || '') : value;
      sectionItems[itemIndex] = normalizedValue;
      newItems[sectionIndex] = {
        section: {
          ...currentSection.section,
          items: sectionItems,
        },
      } as InstructionSection;
      updateInstructions(newItems);
    }
  };

  // Remove item from a section
  const handleRemoveFromSection = (sectionIndex: number, itemIndex: number) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = currentSection.section.items.filter((_: InstructionItem, i: number) => i !== itemIndex);
      newItems[sectionIndex] = {
        section: {
          ...currentSection.section,
          items: sectionItems,
        },
      } as InstructionSection;
      updateInstructions(newItems);
    }
  };

  // Update structured instruction in a section
  const handleSectionStructuredChange = (
    sectionIndex: number,
    itemIndex: number,
    field: keyof InstructionObject,
    value: unknown
  ) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = [...currentSection.section.items];
      const currentItem = sectionItems[itemIndex];
      if (typeof currentItem === 'object' && currentItem !== null && !('section' in currentItem)) {
        const currentObj = currentItem as InstructionObject;
        const normalizedValue = typeof value === 'string' ? (value || '') : value;
        sectionItems[itemIndex] = {
          ...currentObj,
          [field]: normalizedValue,
        } as InstructionObject;
        newItems[sectionIndex] = {
          section: {
            ...currentSection.section,
            items: sectionItems,
          },
        } as InstructionSection;
        updateInstructions(newItems);
      }
    }
  };

  // Update timing field in a section item
  const handleSectionTimingChange = (
    sectionIndex: number,
    itemIndex: number,
    field: keyof NonNullable<InstructionObject['timing']>,
    value: unknown
  ) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = [...currentSection.section.items];
      const currentItem = sectionItems[itemIndex];
      if (typeof currentItem === 'object' && currentItem !== null && !('section' in currentItem)) {
        const currentObj = currentItem as InstructionObject;
        const currentTiming = currentObj.timing || {};
        sectionItems[itemIndex] = {
          ...currentObj,
          timing: {
            ...currentTiming,
            [field]: value,
          },
        } as InstructionObject;
        newItems[sectionIndex] = {
          section: {
            ...currentSection.section,
            items: sectionItems,
          },
        } as InstructionSection;
        updateInstructions(newItems);
      }
    }
  };

  // Update duration type in a section item
  const handleSectionDurationTypeChange = (sectionIndex: number, itemIndex: number, type: 'exact' | 'range') => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = [...currentSection.section.items];
      const currentItem = sectionItems[itemIndex];
      if (typeof currentItem === 'object' && currentItem !== null && !('section' in currentItem)) {
        const currentObj = currentItem as InstructionObject;
        const currentTiming = currentObj.timing || {};
        if (type === 'exact') {
          sectionItems[itemIndex] = {
            ...currentObj,
            timing: {
              ...currentTiming,
              duration: { minutes: 0 },
            },
          } as InstructionObject;
        } else {
          sectionItems[itemIndex] = {
            ...currentObj,
            timing: {
              ...currentTiming,
              duration: { minMinutes: 0, maxMinutes: 0 },
            },
          } as InstructionObject;
        }
        newItems[sectionIndex] = {
          section: {
            ...currentSection.section,
            items: sectionItems,
          },
        } as InstructionSection;
        updateInstructions(newItems);
      }
    }
  };

  // Update duration value in a section item
  const handleSectionDurationValueChange = (
    sectionIndex: number,
    itemIndex: number,
    field: 'minutes' | 'minMinutes' | 'maxMinutes',
    value: number
  ) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = [...currentSection.section.items];
      const currentItem = sectionItems[itemIndex];
      if (typeof currentItem === 'object' && currentItem !== null && !('section' in currentItem)) {
        const currentObj = currentItem as InstructionObject;
        const currentTiming = currentObj.timing || {};
        const currentDuration = currentTiming.duration || {};
        sectionItems[itemIndex] = {
          ...currentObj,
          timing: {
            ...currentTiming,
            duration: {
              ...currentDuration,
              [field]: value,
            },
          },
        } as InstructionObject;
        newItems[sectionIndex] = {
          section: {
            ...currentSection.section,
            items: sectionItems,
          },
        } as InstructionSection;
        updateInstructions(newItems);
      }
    }
  };

  // Add input reference in a section item
  const handleSectionAddInput = (sectionIndex: number, itemIndex: number) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = [...currentSection.section.items];
      const currentItem = sectionItems[itemIndex];
      if (typeof currentItem === 'object' && currentItem !== null && !('section' in currentItem)) {
        const currentObj = currentItem as InstructionObject;
        const currentInputs = currentObj.inputs || [];
        sectionItems[itemIndex] = {
          ...currentObj,
          inputs: [...currentInputs, ''],
        } as InstructionObject;
        newItems[sectionIndex] = {
          section: {
            ...currentSection.section,
            items: sectionItems,
          },
        } as InstructionSection;
        updateInstructions(newItems);
      }
    }
  };

  // Update input reference in a section item
  const handleSectionInputChange = (sectionIndex: number, itemIndex: number, inputIndex: number, value: string) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = [...currentSection.section.items];
      const currentItem = sectionItems[itemIndex];
      if (typeof currentItem === 'object' && currentItem !== null && !('section' in currentItem)) {
        const currentObj = currentItem as InstructionObject;
        const currentInputs = [...(currentObj.inputs || [])];
        currentInputs[inputIndex] = value || '';
        sectionItems[itemIndex] = {
          ...currentObj,
          inputs: currentInputs,
        } as InstructionObject;
        newItems[sectionIndex] = {
          section: {
            ...currentSection.section,
            items: sectionItems,
          },
        } as InstructionSection;
        updateInstructions(newItems);
      }
    }
  };

  // Remove input reference in a section item
  const handleSectionRemoveInput = (sectionIndex: number, itemIndex: number, inputIndex: number) => {
    const newItems = [...items];
    const current = newItems[sectionIndex];
    if (typeof current === 'object' && current !== null && 'section' in current) {
      const currentSection = current as InstructionSection;
      const sectionItems = [...currentSection.section.items];
      const currentItem = sectionItems[itemIndex];
      if (typeof currentItem === 'object' && currentItem !== null && !('section' in currentItem)) {
        const currentObj = currentItem as InstructionObject;
        const currentInputs = (currentObj.inputs || []).filter((_, i) => i !== inputIndex);
        sectionItems[itemIndex] = {
          ...currentObj,
          inputs: currentInputs,
        } as InstructionObject;
        newItems[sectionIndex] = {
          section: {
            ...currentSection.section,
            items: sectionItems,
          },
        } as InstructionSection;
        updateInstructions(newItems);
      }
    }
  };

  // Update a string instruction
  const handleStringChange = (index: number, value: string) => {
    // Preserve focus state - if this input is focused, keep it focused after update
    const wasFocused = focusedIndex === index;
    const newItems = [...items];
    newItems[index] = value || '';
    updateInstructions(newItems);
    // Restore focus state if it was focused
    if (wasFocused) {
      setFocusedIndex(index);
    }
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
    field: keyof NonNullable<InstructionObject['timing']>,
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
    return typeof item === 'object' && item !== null && !('section' in item);
  };

  // Check if item is a section
  const isSection = (item: InstructionItem): item is InstructionSection => {
    return typeof item === 'object' && item !== null && 'section' in item;
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
          title="Add step"
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
          <textarea
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
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '8px 12px',
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
                    value={('maxMinutes' in duration ? duration.maxMinutes || 0 : 0) as number}
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

  // Render a section
  const renderSection = (item: InstructionSection, index: number) => {
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
            marginTop: '12px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '4px',
              backgroundColor: hasTimed ? 'rgba(59, 130, 246, 0.025)' : 'rgba(0, 0, 0, 0.03)',
              border: showSectionActions ? '1px solid #d0d0d0' : '1px solid transparent',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
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
                width: '100%',
                padding: 0,
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: 'transparent',
                outline: 'none',
              }}
            />
          </div>
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
                + Step
              </button>
              {hasStructured && (
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
              )}
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
              No steps in this section yet
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea
                        value={sectionItem || ''}
                        onChange={(e) =>
                          handleSectionItemChange(index, itemIdx, e.target.value || '')
                        }
                        onFocus={() => setFocusedSectionItem(itemKey)}
                        onBlur={() => setFocusedSectionItem(null)}
                        placeholder="Step instruction"
                        rows={2}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: showItemActions ? '1px solid #d0d0d0' : '1px solid transparent',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
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
                            alignSelf: 'flex-start',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : isStructured(sectionItem) ? (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                        <textarea
                          value={sectionItem.text || ''}
                          onChange={(e) => handleSectionStructuredChange(index, itemIdx, 'text', e.target.value || '')}
                          onFocus={() => setFocusedSectionItem(itemKey)}
                          onBlur={() => setFocusedSectionItem(null)}
                          placeholder="Step instruction"
                          rows={3}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: showItemActions ? '1px solid #d0d0d0' : '1px solid transparent',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
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
                              alignSelf: 'flex-start',
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Timing controls (when timed stack enabled) */}
                      {hasTimed && showItemActions && (
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
                            <select
                              value={sectionItem.timing?.activity || ''}
                              onChange={(e) => handleSectionTimingChange(index, itemIdx, 'activity', e.target.value || undefined)}
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

                            {(() => {
                              const durationType = sectionItem.timing?.duration && 'minutes' in (sectionItem.timing.duration || {}) ? 'exact' : 'range';
                              const duration = sectionItem.timing?.duration || (durationType === 'exact' ? { minutes: 0 } : { minMinutes: 0, maxMinutes: 0 });
                              return (
                                <>
                                  <select
                                    value={durationType}
                                    onChange={(e) => handleSectionDurationTypeChange(index, itemIdx, e.target.value as 'exact' | 'range')}
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

                                  {durationType === 'exact' && 'minutes' in duration && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <input
                                        type="number"
                                        value={duration.minutes || 0}
                                        onChange={(e) => handleSectionDurationValueChange(index, itemIdx, 'minutes', Number(e.target.value))}
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
                                        onChange={(e) => handleSectionDurationValueChange(index, itemIdx, 'minMinutes', Number(e.target.value))}
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
                                        value={('maxMinutes' in duration ? duration.maxMinutes || 0 : 0) as number}
                                        onChange={(e) => handleSectionDurationValueChange(index, itemIdx, 'maxMinutes', Number(e.target.value))}
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
                                </>
                              );
                            })()}

                            <input
                              type="text"
                              value={sectionItem.timing?.completionCue || ''}
                              onChange={(e) => handleSectionTimingChange(index, itemIdx, 'completionCue', e.target.value || undefined)}
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
                      {hasReferenced && showItemActions && (
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
                              onClick={() => handleSectionAddInput(index, itemIdx)}
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
                          {sectionItem.inputs && sectionItem.inputs.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {sectionItem.inputs.map((inputId, inputIdx) => (
                                <div key={inputIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    value={inputId || ''}
                                    onChange={(e) => handleSectionInputChange(index, itemIdx, inputIdx, e.target.value || '')}
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
                                    onClick={() => handleSectionRemoveInput(index, itemIdx, inputIdx)}
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
          paddingLeft: hasTimed ? '12px' : '0',
          borderLeft: hasTimed ? '3px solid var(--cap-timed)' : 'none',
          backgroundColor: hasTimed ? 'var(--cap-timed-bg)' : 'transparent',
          paddingTop: hasTimed ? '8px' : '0',
          paddingBottom: hasTimed ? '8px' : '0',
          borderRadius: hasTimed ? '4px' : '0',
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
            + Add first step
          </button>
        </div>
      ) : (
        <>
          {items.map((item, idx) => {
            if (isString(item)) {
              return renderStringInstruction(item, idx);
            } else if (isStructured(item)) {
              return renderStructuredInstruction(item, idx);
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
                width: '24px',
                height: '24px',
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
                fontSize: '20px',
                lineHeight: '1',
                fontWeight: '300',
              }}
              title="Add step"
            >
              +
            </button>
            <div style={{ flex: 1, padding: '8px 12px', color: '#999', fontSize: '13px' }}>
              Add step
            </div>
          </div>
        </>
      )}
      
      {/* Creator timing hint - appears after instructions list */}
      {showCreatorHints && shouldSuggestTimed(recipe) && (
        <InlineHint
          message="💡 Add timing?"
          action={{
            label: 'Enable timed',
            onClick: () => {
              const next = {
                ...recipe,
                stacks: enableStack(enableStack(recipe.stacks, 'timed'), 'structured'),
              };
              onChange(next);
            },
          }}
        />
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

