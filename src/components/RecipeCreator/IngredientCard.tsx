'use client';

import { useState } from 'react';

type IngredientCardProps = {
  id: string;
  ingredient: unknown;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (value: unknown) => void;
  onRemove: () => void;
};

export default function IngredientCard({
  id,
  ingredient,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
}: IngredientCardProps) {
  const [hovered, setHovered] = useState(false);

  // Parse ingredient
  const isString = typeof ingredient === 'string';
  const isObject = typeof ingredient === 'object' && ingredient !== null && !Array.isArray(ingredient);
  const obj = isObject ? (ingredient as { quantity?: string | number; unit?: string; name?: string; prep?: string }) : null;

  // Display text
  const displayText = isString
    ? ingredient
    : obj
      ? [obj.quantity, obj.unit, obj.name].filter(Boolean).join(' ')
      : String(ingredient);

  const handleTextChange = (text: string) => {
    onChange(text);
  };

  const handleStructuredChange = (field: 'quantity' | 'unit' | 'name' | 'prep', value: string) => {
    if (!isObject) {
      // Convert string to object
      const currentName = isString ? ingredient : '';
      onChange({ quantity: '', unit: '', name: currentName, [field]: value });
    } else {
      onChange({ ...obj, [field]: value });
    }
  };

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '12px',
        backgroundColor: hovered ? '#fafafa' : '#fff',
        transition: 'background-color 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ cursor: 'grab', color: hovered ? '#666' : 'transparent', transition: 'color 0.2s ease' }}>
          <span style={{ fontSize: '18px', userSelect: 'none' }}>⋮⋮</span>
        </div>
        <div style={{ flex: 1 }}>
          {!isExpanded ? (
            <div style={{ fontSize: '14px' }}>{displayText || 'Ingredient'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={obj?.quantity || ''}
                  onChange={(e) => handleStructuredChange('quantity', e.target.value)}
                  placeholder="Qty"
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="text"
                  value={obj?.unit || ''}
                  onChange={(e) => handleStructuredChange('unit', e.target.value)}
                  placeholder="Unit"
                  style={{
                    width: '100px',
                    padding: '8px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="text"
                  value={obj?.name || (isString ? ingredient : '')}
                  onChange={(e) => handleStructuredChange('name', e.target.value)}
                  placeholder="Name"
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '8px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <input
                type="text"
                value={obj?.prep || ''}
                onChange={(e) => handleStructuredChange('prep', e.target.value)}
                placeholder="Prep (optional, e.g., sifted, diced)"
                style={{
                  padding: '8px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={onToggleExpand}
            style={{
              padding: '4px 8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#666',
            }}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          {hovered && (
            <button
              onClick={onRemove}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#999',
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
