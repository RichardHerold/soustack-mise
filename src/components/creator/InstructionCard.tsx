'use client';

export type InstructionObject = {
  text: string;
  timing?: {
    duration?: { minutes: number } | { minMinutes: number; maxMinutes: number };
    activity?: 'active' | 'passive';
    completionCue?: string;
  };
};

type InstructionCardProps = {
  instruction: string | InstructionObject;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (updated: string | InstructionObject) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

function formatTimingBadge(timing: InstructionObject['timing']): string | null {
  if (!timing?.duration) return null;

  let durationStr = '';
  if ('minutes' in timing.duration) {
    durationStr = `${timing.duration.minutes}m`;
  } else {
    durationStr = `${timing.duration.minMinutes}-${timing.duration.maxMinutes}m`;
  }

  return durationStr;
}

export default function InstructionCard({
  instruction,
  index,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: InstructionCardProps) {
  const isObject = typeof instruction !== 'string';
  const displayText = isObject ? instruction.text : instruction;
  const timingBadge = isObject && instruction.timing ? formatTimingBadge(instruction.timing) : null;

  // Convert string to object when expanding
  const handleExpand = () => {
    if (!isExpanded && typeof instruction === 'string') {
      onChange({
        text: instruction.trim(),
      });
    }
    onToggleExpand();
  };

  if (!isExpanded) {
    return (
      <div className="instruction-card">
        <div className="card-header" onClick={handleExpand} style={{ cursor: 'pointer' }}>
          <span className="drag-handle" style={{ cursor: 'grab' }}>
            ⋮⋮
          </span>
          <span style={{ flex: 1 }}>
            {index + 1}. {displayText}
          </span>
          {timingBadge && (
            <span className="timing-badge" style={{ marginRight: 'var(--space-xs)' }}>
              ⏱️ {timingBadge}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="btn btn-ghost"
            style={{ padding: 'var(--space-xs)' }}
          >
            ▼
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="btn btn-ghost"
            style={{ padding: 'var(--space-xs)' }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Expanded state - ensure we're working with an object
  const obj: InstructionObject =
    typeof instruction === 'string'
      ? { text: instruction.trim() }
      : { ...instruction };

  const updateField = <K extends keyof InstructionObject>(
    field: K,
    value: InstructionObject[K]
  ) => {
    onChange({ ...obj, [field]: value });
  };

  const updateTiming = (updates: Partial<InstructionObject['timing']>) => {
    updateField('timing', {
      ...obj.timing,
      ...updates,
    });
  };

  const durationType =
    obj.timing?.duration && 'minMinutes' in obj.timing.duration ? 'range' : 'exact';

  return (
    <div className="instruction-card expanded">
      <div className="card-header">
        <span className="drag-handle" style={{ cursor: 'grab' }}>
          ⋮⋮
        </span>
        <span style={{ flex: 1, fontWeight: 600 }}>Step {index + 1}</span>
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            className="btn btn-ghost"
            style={{ padding: 'var(--space-xs)' }}
            disabled={index === 0}
          >
            ↑
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            className="btn btn-ghost"
            style={{ padding: 'var(--space-xs)' }}
          >
            ↓
          </button>
        )}
        <button
          onClick={onToggleExpand}
          className="btn btn-ghost"
          style={{ padding: 'var(--space-xs)' }}
        >
          ▲
        </button>
        <button
          onClick={onRemove}
          className="btn btn-ghost"
          style={{ padding: 'var(--space-xs)' }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Instruction text */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
            Instruction
          </label>
          <textarea
            value={obj.text}
            onChange={(e) => updateField('text', e.target.value)}
            placeholder="Bake until golden"
            rows={3}
            style={{ width: '100%' }}
          />
        </div>

        {/* Timing section */}
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
            <span>⏱️</span>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              Timing (optional)
            </label>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
              Duration
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`duration-${index}`}
                  checked={durationType === 'exact'}
                  onChange={() => {
                    if (obj.timing?.duration && 'minMinutes' in obj.timing.duration) {
                      updateTiming({ duration: { minutes: obj.timing.duration.minMinutes } });
                    } else if (!obj.timing?.duration) {
                      updateTiming({ duration: { minutes: 10 } });
                    }
                  }}
                />
                <span style={{ fontSize: 'var(--text-sm)' }}>Exact:</span>
              </label>
              {durationType === 'exact' && (
                <input
                  type="number"
                  value={obj.timing?.duration && 'minutes' in obj.timing.duration ? obj.timing.duration.minutes : ''}
                  onChange={(e) => {
                    const minutes = Number(e.target.value);
                    if (minutes > 0) {
                      updateTiming({ duration: { minutes } });
                    } else {
                      updateTiming({ duration: undefined });
                    }
                  }}
                  placeholder="10"
                  style={{ width: '80px' }}
                />
              )}
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>minutes</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`duration-${index}`}
                  checked={durationType === 'range'}
                  onChange={() => {
                    if (obj.timing?.duration && 'minutes' in obj.timing.duration) {
                      const minutes = obj.timing.duration.minutes;
                      updateTiming({ duration: { minMinutes: minutes, maxMinutes: minutes + 1 } });
                    } else if (!obj.timing?.duration) {
                      updateTiming({ duration: { minMinutes: 10, maxMinutes: 12 } });
                    }
                  }}
                />
                <span style={{ fontSize: 'var(--text-sm)' }}>Range:</span>
              </label>
              {durationType === 'range' && (
                <>
                  <input
                    type="number"
                    value={obj.timing?.duration && 'minMinutes' in obj.timing.duration ? obj.timing.duration.minMinutes : ''}
                    onChange={(e) => {
                      const minMinutes = Number(e.target.value);
                      const maxMinutes = obj.timing?.duration && 'maxMinutes' in obj.timing.duration ? obj.timing.duration.maxMinutes : minMinutes + 1;
                      updateTiming({ duration: { minMinutes, maxMinutes } });
                    }}
                    placeholder="9"
                    style={{ width: '60px' }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>to</span>
                  <input
                    type="number"
                    value={obj.timing?.duration && 'maxMinutes' in obj.timing.duration ? obj.timing.duration.maxMinutes : ''}
                    onChange={(e) => {
                      const minMinutes = obj.timing?.duration && 'minMinutes' in obj.timing.duration ? obj.timing.duration.minMinutes : 10;
                      const maxMinutes = Number(e.target.value);
                      updateTiming({ duration: { minMinutes, maxMinutes } });
                    }}
                    placeholder="11"
                    style={{ width: '60px' }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>minutes</span>
                </>
              )}
            </div>
          </div>

          {/* Activity */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
              Activity
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`activity-${index}`}
                  checked={obj.timing?.activity === 'active'}
                  onChange={() => updateTiming({ activity: 'active' })}
                />
                <span style={{ fontSize: 'var(--text-sm)' }}>Active</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`activity-${index}`}
                  checked={obj.timing?.activity === 'passive'}
                  onChange={() => updateTiming({ activity: 'passive' })}
                />
                <span style={{ fontSize: 'var(--text-sm)' }}>Passive</span>
              </label>
            </div>
          </div>

          {/* Completion cue */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
              Done when
            </label>
            <input
              type="text"
              value={obj.timing?.completionCue || ''}
              onChange={(e) => updateTiming({ completionCue: e.target.value || undefined })}
              placeholder="golden brown"
              style={{ width: '100%' }}
            />
          </div>

          {/* Remove timing button */}
          {obj.timing && (
            <button
              onClick={() => updateField('timing', undefined)}
              className="btn btn-ghost"
              style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--text-xs)' }}
            >
              Remove timing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
