'use client';

import { useState, useEffect } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

// Types for storage structures
type StorageMethod = {
  duration: {
    iso8601: string;
  };
  notes?: string;
};

type StorageData = {
  refrigerated?: StorageMethod;
  frozen?: StorageMethod;
  roomTemp?: StorageMethod;
  leftovers?: {
    reheat?: (string | ReheatMethod)[];
  };
};

type ReheatMethod = {
  method: string;
  temp?: string;
  duration?: string;
  notes?: string;
};

type AfterCookingSectionProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
};

/**
 * After Cooking section component (Storage & leftovers)
 * - Visible when storage@1 stack is enabled
 * - Collapsed suggestion when disabled
 * - Storage methods: refrigerated, frozen, roomTemp
 * - Leftovers reheat instructions
 */
export default function AfterCookingSection({
  recipe,
  onChange,
}: AfterCookingSectionProps) {
  // Check for storage@1 (versioned) or storage (capability declaration)
  const isEnabled =
    ('storage@1' in recipe.stacks && recipe.stacks['storage@1'] !== undefined) ||
    ('storage' in recipe.stacks && recipe.stacks['storage'] !== undefined);

  // Get storage data from recipe
  const getStorageData = (): StorageData => {
    if (!isEnabled) return {};
    const storage = (recipe as SoustackLiteRecipe & { storage?: StorageData }).storage;
    return storage || {};
  };

  const [storageData, setStorageData] = useState<StorageData>(getStorageData());

  // Sync storage data when recipe changes externally
  useEffect(() => {
    const currentData = getStorageData();
    setStorageData(currentData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.stacks, (recipe as SoustackLiteRecipe & { storage?: StorageData }).storage]);

  const handleToggleStack = () => {
    const next = { ...recipe };
    if (isEnabled) {
      // Disable: remove storage@1 from stacks and clear storage data
      const { 'storage@1': _, ...restStacks } = next.stacks;
      next.stacks = restStacks;
      delete (next as SoustackLiteRecipe & { storage?: StorageData }).storage;
      setStorageData({});
    } else {
      // Enable: add storage@1 to stacks (versioned key as per requirements)
      next.stacks = {
        ...next.stacks,
        'storage@1': 1,
      };
      setStorageData({});
    }
    onChange(next);
  };

  const updateStorageData = (newData: StorageData) => {
    setStorageData(newData);
    const next = {
      ...recipe,
      storage: newData,
    } as SoustackLiteRecipe & { storage?: StorageData };
    onChange(next);
  };

  const handleStorageMethodChange = (
    method: 'refrigerated' | 'frozen' | 'roomTemp',
    field: 'duration' | 'notes',
    value: string
  ) => {
    const newData = { ...storageData };
    if (!newData[method]) {
      newData[method] = { duration: { iso8601: '' } };
    }
    if (field === 'duration') {
      newData[method] = {
        ...newData[method],
        duration: { iso8601: value },
      };
    } else {
      newData[method] = {
        ...newData[method],
        notes: value,
      };
    }
    updateStorageData(newData);
  };

  const handleRemoveStorageMethod = (method: 'refrigerated' | 'frozen' | 'roomTemp') => {
    const newData = { ...storageData };
    delete newData[method];
    updateStorageData(newData);
  };

  const handleAddStorageMethod = (method: 'refrigerated' | 'frozen' | 'roomTemp') => {
    const newData = { ...storageData };
    newData[method] = { duration: { iso8601: '' } };
    updateStorageData(newData);
  };

  const handleReheatAdd = (asString: boolean) => {
    const newData = { ...storageData };
    if (!newData.leftovers) {
      newData.leftovers = {};
    }
    if (!newData.leftovers.reheat) {
      newData.leftovers.reheat = [];
    }
    const reheatArray = [...newData.leftovers.reheat];
    if (asString) {
      reheatArray.push('');
    } else {
      reheatArray.push({ method: '' });
    }
    newData.leftovers.reheat = reheatArray;
    updateStorageData(newData);
  };

  const handleReheatChange = (index: number, value: string | ReheatMethod) => {
    const newData = { ...storageData };
    if (newData.leftovers?.reheat) {
      const reheatArray = [...newData.leftovers.reheat];
      reheatArray[index] = value;
      newData.leftovers.reheat = reheatArray;
      updateStorageData(newData);
    }
  };

  const handleReheatRemove = (index: number) => {
    const newData = { ...storageData };
    if (newData.leftovers?.reheat) {
      const reheatArray = newData.leftovers.reheat.filter((_, i) => i !== index);
      newData.leftovers.reheat = reheatArray.length > 0 ? reheatArray : undefined;
      if (!newData.leftovers.reheat && Object.keys(newData.leftovers).length === 0) {
        delete newData.leftovers;
      }
      updateStorageData(newData);
    }
  };

  const isReheatString = (item: string | ReheatMethod): item is string => {
    return typeof item === 'string';
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
              After Cooking (Storage & Leftovers)
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#999',
                fontStyle: 'italic',
              }}
            >
              Add after-cooking notes
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
          After Cooking (Storage & Leftovers)
        </label>
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

      {/* Storage Methods */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '8px',
            color: '#666',
          }}
        >
          Storage Methods
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#999',
            marginBottom: '12px',
            fontStyle: 'italic',
          }}
        >
          Choose one method (refrigerated, frozen, or room temperature)
        </div>
        {(['refrigerated', 'frozen', 'roomTemp'] as const).map((method) => {
          const methodData = storageData[method];
          const methodLabel =
            method === 'refrigerated'
              ? 'Refrigerated'
              : method === 'frozen'
                ? 'Frozen'
                : 'Room Temperature';

          if (!methodData) {
            return (
              <div key={method} style={{ marginBottom: '8px' }}>
                <button
                  onClick={() => handleAddStorageMethod(method)}
                  style={{
                    padding: '8px 12px',
                    border: '1px dashed #d0d0d0',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#666',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  + Add {methodLabel}
                </button>
              </div>
            );
          }

          return (
            <div
              key={method}
              style={{
                marginBottom: '12px',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: '#fafafa',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#666',
                  }}
                >
                  {methodLabel}
                </div>
                <button
                  onClick={() => handleRemoveStorageMethod(method)}
                  style={{
                    padding: '4px 8px',
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
              <div style={{ marginBottom: '8px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  Duration (ISO 8601, e.g., P3D for 3 days)
                </label>
                <input
                  type="text"
                  value={methodData.duration?.iso8601 || ''}
                  onChange={(e) =>
                    handleStorageMethodChange(method, 'duration', e.target.value)
                  }
                  placeholder="P3D"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  Notes (optional)
                </label>
                <textarea
                  value={methodData.notes || ''}
                  onChange={(e) =>
                    handleStorageMethodChange(method, 'notes', e.target.value)
                  }
                  placeholder="Additional storage notes..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Leftovers Reheat */}
      <div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '8px',
            color: '#666',
          }}
        >
          Leftovers Reheat
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => handleReheatAdd(true)}
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
            onClick={() => handleReheatAdd(false)}
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
        </div>
        {!storageData.leftovers?.reheat ||
        storageData.leftovers.reheat.length === 0 ? (
          <div
            style={{
              padding: '12px',
              border: '1px dashed #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fafafa',
              textAlign: 'center',
              color: '#999',
              fontSize: '13px',
            }}
          >
            No reheat instructions yet. Add a string or structured method.
          </div>
        ) : (
          storageData.leftovers.reheat.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                alignItems: 'flex-start',
              }}
            >
              {isReheatString(item) ? (
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleReheatChange(idx, e.target.value)}
                  placeholder="Reheat instruction (e.g., Microwave for 2 minutes)"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    type="text"
                    value={item.method || ''}
                    onChange={(e) =>
                      handleReheatChange(idx, { ...item, method: e.target.value })
                    }
                    placeholder="Method"
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '8px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                  <input
                    type="text"
                    value={item.temp || ''}
                    onChange={(e) =>
                      handleReheatChange(idx, { ...item, temp: e.target.value })
                    }
                    placeholder="Temp (optional)"
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
                    value={item.duration || ''}
                    onChange={(e) =>
                      handleReheatChange(idx, { ...item, duration: e.target.value })
                    }
                    placeholder="Duration (optional)"
                    style={{
                      width: '120px',
                      padding: '8px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                  <textarea
                    value={item.notes || ''}
                    onChange={(e) =>
                      handleReheatChange(idx, { ...item, notes: e.target.value })
                    }
                    placeholder="Notes (optional)"
                    rows={1}
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      padding: '8px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>
              )}
              <button
                onClick={() => handleReheatRemove(idx)}
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
    </div>
  );
}

