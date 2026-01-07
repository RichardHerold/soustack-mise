'use client';

import type { SoustackLiteRecipe } from '@/lib/mise/types';

type CapabilitiesPanelProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
};

/**
 * Capability toggles for recipe stacks
 * - Shows toggles for: prep, equipment, timed, storage, scaling
 * - Optionally: structured, referenced, illustrated (for future use)
 * - Toggle ON/OFF mutates only recipe.stacks[stack] = 1 or deletes the key
 * - Toggling only declares capability; does not create content
 */
export default function CapabilitiesPanel({
  recipe,
  onChange,
}: CapabilitiesPanelProps) {
  const handleStackToggle = (stackName: string, enabled: boolean) => {
    const currentStacks = { ...recipe.stacks };
    
    if (enabled) {
      // Add stack with version 1 (just capability declaration)
      currentStacks[stackName] = 1;
    } else {
      // Remove stack declaration only
      // Preserve any existing payload blocks (e.g., prep@1, scaling@1) if present
      delete currentStacks[stackName];
    }

    const next = {
      ...recipe,
      stacks: currentStacks,
    };

    onChange(next);
  };

  // Primary capabilities
  const primaryCapabilities = [
    { key: 'prep', label: 'Prep' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'timed', label: 'Timed' },
    { key: 'storage', label: 'Storage' },
    { key: 'scaling', label: 'Scaling' },
  ] as const;

  // Optional capabilities (for future use)
  const optionalCapabilities = [
    { key: 'structured', label: 'Structured' },
    { key: 'referenced', label: 'Referenced' },
    { key: 'illustrated', label: 'Illustrated' },
  ] as const;

  const isEnabled = (stackKey: string) => {
    return stackKey in recipe.stacks && recipe.stacks[stackKey] !== undefined;
  };

  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '12px',
          fontSize: '13px',
          fontWeight: 500,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Capabilities
      </label>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {primaryCapabilities.map((capability) => {
          const enabled = isEnabled(capability.key);
          return (
            <label
              key={capability.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: enabled ? '#f0f9ff' : '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                userSelect: 'none',
                transition: 'background-color 0.2s',
              }}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleStackToggle(capability.key, e.target.checked)}
                style={{
                  cursor: 'pointer',
                }}
              />
              <span>{capability.label}</span>
            </label>
          );
        })}
      </div>
      {optionalCapabilities.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#999',
              marginBottom: '8px',
              fontStyle: 'italic',
            }}
          >
            Optional (future)
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {optionalCapabilities.map((capability) => {
              const enabled = isEnabled(capability.key);
              return (
                <label
                  key={capability.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    backgroundColor: enabled ? '#f0f9ff' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    userSelect: 'none',
                    opacity: 0.6,
                    transition: 'background-color 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleStackToggle(capability.key, e.target.checked)}
                    style={{
                      cursor: 'pointer',
                    }}
                  />
                  <span>{capability.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
      <div
        style={{
          marginTop: '16px',
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666',
          lineHeight: '1.4',
        }}
      >
        <div style={{ fontWeight: 500, marginBottom: '4px' }}>Note:</div>
        <div>
          Toggling capabilities only declares them. Content sections appear when enabled.
        </div>
      </div>
    </div>
  );
}

