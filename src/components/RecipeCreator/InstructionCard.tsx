'use client';

import { useState } from 'react';

type InstructionCardProps = {
  id: string;
  index: number;
  instruction: unknown;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (value: unknown) => void;
  onRemove: () => void;
};

export default function InstructionCard({
  id,
  index,
  instruction,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
}: InstructionCardProps) {
  const [hovered, setHovered] = useState(false);

  // Parse instruction
  const isString = typeof instruction === 'string';
  const isObject = typeof instruction === 'object' && instruction !== null && !Array.isArray(instruction);
  const obj = isObject
    ? (instruction as {
        text?: string;
        timing?: {
          activity?: 'active' | 'passive';
          duration?: { minutes?: number } | { minMinutes?: number; maxMinutes?: number };
          completionCue?: string;
        };
      })
    : null;

  // Display text
  const displayText = isString ? instruction : obj?.text || String(instruction);

  const handleTextChange = (text: string) => {
    if (isObject && obj) {
      onChange({ ...obj, text });
    } else {
      onChange(text);
    }
  };

  const handleTimingChange = (field: string, value: unknown) => {
    if (!isObject || !obj) {
      onChange({ text: displayText, timing: { [field]: value } });
    } else {
      onChange({
        ...obj,
        timing: {
          ...(obj.timing || {}),
          [field]: value,
        },
      });
    }
  };

  const duration = obj?.timing?.duration;
  const durationType = duration && 'minutes' in duration ? 'exact' : 'range';

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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ cursor: 'grab', color: hovered ? '#666' : 'transparent', transition: 'color 0.2s ease', paddingTop: '4px' }}>
          <span style={{ fontSize: '18px', userSelect: 'none' }}>⋮⋮</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#666' }}>{index + 1}</span>
          </div>
          {!isExpanded ? (
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{displayText || 'Step instruction'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={isString ? instruction : obj?.text || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Step instruction"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              {/* Timing controls */}
              <div
                style={{
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  backgroundColor: '#fafafa',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#666' }}>
                  ⏱️ Timing (optional)
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    value={obj?.timing?.activity || ''}
                    onChange={(e) => handleTimingChange('activity', e.target.value || undefined)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <option value="">Activity</option>
                    <option value="active">Active</option>
                    <option value="passive">Passive</option>
                  </select>
                  <select
                    value={durationType}
                    onChange={(e) => {
                      const type = e.target.value as 'exact' | 'range';
                      if (type === 'exact') {
                        handleTimingChange('duration', { minutes: 0 });
                      } else {
                        handleTimingChange('duration', { minMinutes: 0, maxMinutes: 0 });
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <option value="exact">Exact</option>
                    <option value="range">Range</option>
                  </select>
                  {durationType === 'exact' && duration && 'minutes' in duration && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        value={(duration as { minutes?: number }).minutes || 0}
                        onChange={(e) => handleTimingChange('duration', { minutes: Number(e.target.value) })}
                        min="0"
                        step="0.5"
                        style={{
                          width: '70px',
                          padding: '6px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#666' }}>min</span>
                    </div>
                  )}
                  {durationType === 'range' && duration && ('minMinutes' in duration || 'maxMinutes' in duration) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        value={duration && 'minMinutes' in duration ? (duration as { minMinutes?: number }).minMinutes || 0 : 0}
                        onChange={(e) => {
                          const rangeDuration = duration as { minMinutes?: number; maxMinutes?: number };
                          handleTimingChange('duration', {
                            minMinutes: Number(e.target.value),
                            maxMinutes: rangeDuration?.maxMinutes || 0,
                          });
                        }}
                        min="0"
                        step="0.5"
                        style={{
                          width: '60px',
                          padding: '6px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#666' }}>-</span>
                      <input
                        type="number"
                        value={duration && 'maxMinutes' in duration ? (duration as { maxMinutes?: number }).maxMinutes || 0 : 0}
                        onChange={(e) => {
                          const rangeDuration = duration as { minMinutes?: number; maxMinutes?: number };
                          handleTimingChange('duration', {
                            minMinutes: rangeDuration?.minMinutes || 0,
                            maxMinutes: Number(e.target.value),
                          });
                        }}
                        min="0"
                        step="0.5"
                        style={{
                          width: '60px',
                          padding: '6px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#666' }}>min</span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={obj?.timing?.completionCue || ''}
                    onChange={(e) => handleTimingChange('completionCue', e.target.value || undefined)}
                    placeholder="Done when..."
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '6px 10px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
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
