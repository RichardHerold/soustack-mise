'use client';

import { useState, useEffect } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

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
 * - Scaling UI when scaling@1 enabled
 */
export default function IngredientsSection({
  recipe,
  onChange,
}: IngredientsSectionProps) {
  const hasScaling = 'scaling@1' in recipe.stacks && recipe.stacks['scaling@1'] !== undefined;

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

  // Sync items when recipe changes externally
  useEffect(() => {
    const currentItems = parseIngredients();
    setItems(currentItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.ingredients]);

  // Update recipe with new ingredients
  const updateIngredients = (newItems: IngredientItem[]) => {
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

  // Add a simple string ingredient
  const handleAddString = () => {
    const newItems = [...items, ''];
    updateIngredients(newItems);
  };

  // Add a structured ingredient object
  const handleAddStructured = () => {
    const newItems = [...items, { name: '', quantity: '', unit: '' }];
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
    const newItems = [...items];
    newItems[index] = value;
    updateIngredients(newItems);
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
      newItems[index] = {
        ...currentObj,
        [field]: value,
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
          name,
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
      sectionItems[itemIndex] = value;
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
  const renderStringIngredient = (item: IngredientString, index: number) => (
    <div
      key={index}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '8px',
        alignItems: 'center',
      }}
    >
      <input
        type="text"
        value={item}
        onChange={(e) => handleStringChange(index, e.target.value)}
        placeholder="Ingredient (e.g., 2 cups flour)"
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      />
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
  );

  // Render a structured ingredient
  const renderStructuredIngredient = (item: IngredientObject, index: number) => (
    <div
      key={index}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {/* Quantity */}
      <input
        type="text"
        value={item.quantity || ''}
        onChange={(e) => handleStructuredChange(index, 'quantity', e.target.value)}
        placeholder="Qty"
        style={{
          width: '80px',
          padding: '8px 12px',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      />
      {/* Unit */}
      <input
        type="text"
        value={item.unit || ''}
        onChange={(e) => handleStructuredChange(index, 'unit', e.target.value)}
        placeholder="Unit"
        style={{
          width: '100px',
          padding: '8px 12px',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      />
      {/* Name */}
      <input
        type="text"
        value={item.name || ''}
        onChange={(e) => handleStructuredChange(index, 'name', e.target.value)}
        placeholder="Ingredient name"
        style={{
          flex: 1,
          minWidth: '150px',
          padding: '8px 12px',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      />
      {/* Scaling UI (only when scaling@1 enabled) */}
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
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            fontSize: '13px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="proportional">Proportional</option>
          <option value="toTaste">To taste</option>
          <option value="fixed">Fixed</option>
        </select>
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
  );

  // Render a section
  const renderSection = (item: IngredientSection, index: number) => (
    <div
      key={index}
      style={{
        marginBottom: '16px',
        padding: '16px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#fafafa',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <input
          type="text"
          value={item.section.name}
          onChange={(e) => handleSectionNameChange(index, e.target.value)}
          placeholder="Section name (e.g., For the sauce)"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: '#fff',
          }}
        />
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
          item.section.items.map((sectionItem, itemIdx) => (
            <div key={itemIdx} style={{ marginBottom: '8px' }}>
              {isString(sectionItem) ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={sectionItem}
                    onChange={(e) =>
                      handleSectionItemChange(index, itemIdx, e.target.value)
                    }
                    placeholder="Ingredient"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
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
                </div>
              ) : isStructured(sectionItem) ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={sectionItem.quantity || ''}
                    onChange={(e) =>
                      handleSectionItemChange(index, itemIdx, {
                        ...sectionItem,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="Qty"
                    style={{
                      width: '80px',
                      padding: '8px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                  <input
                    type="text"
                    value={sectionItem.unit || ''}
                    onChange={(e) =>
                      handleSectionItemChange(index, itemIdx, {
                        ...sectionItem,
                        unit: e.target.value,
                      })
                    }
                    placeholder="Unit"
                    style={{
                      width: '100px',
                      padding: '8px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                  <input
                    type="text"
                    value={sectionItem.name || ''}
                    onChange={(e) =>
                      handleSectionItemChange(index, itemIdx, {
                        ...sectionItem,
                        name: e.target.value,
                      })
                    }
                    placeholder="Name"
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      padding: '8px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '14px',
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
                        border: '1px solid #d0d0d0',
                        borderRadius: '4px',
                        fontSize: '13px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="proportional">Proportional</option>
                      <option value="toTaste">To taste</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  )}
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
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );

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
          Ingredients
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
          No ingredients yet. Add a string, structured, or section item.
        </div>
      ) : (
        items.map((item, idx) => {
          if (isString(item)) {
            return renderStringIngredient(item, idx);
          } else if (isStructured(item)) {
            return renderStructuredIngredient(item, idx);
          } else if (isSection(item)) {
            return renderSection(item, idx);
          }
          return null;
        })
      )}
    </div>
  );
}

