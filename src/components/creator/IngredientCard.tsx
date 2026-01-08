'use client';

export type IngredientObject = {
  quantity?: number | { min: number; max: number };
  unit?: string;
  name: string;
  prep?: string;
  toTaste?: boolean;
};

type IngredientCardProps = {
  ingredient: string | IngredientObject;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (updated: string | IngredientObject) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

const UNITS = [
  'cups',
  'tbsp',
  'tsp',
  'ml',
  'L',
  'fl oz',
  'g',
  'kg',
  'oz',
  'lb',
  '',
  'cloves',
  'slices',
  'pieces',
  'bunch',
  'pinch',
  'dash',
];

function formatIngredient(ingredient: string | IngredientObject): string {
  if (typeof ingredient === 'string') {
    return ingredient;
  }

  const parts: string[] = [];

  // Quantity
  if (ingredient.quantity !== undefined) {
    if (typeof ingredient.quantity === 'number') {
      parts.push(String(ingredient.quantity));
    } else {
      parts.push(`${ingredient.quantity.min}-${ingredient.quantity.max}`);
    }
  }

  // Unit
  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }

  // Name
  parts.push(ingredient.name);

  // Prep
  if (ingredient.prep) {
    parts.push(ingredient.prep);
  }

  // To taste indicator
  if (ingredient.toTaste) {
    parts.push('(to taste)');
  }

  return parts.join(' ');
}

export default function IngredientCard({
  ingredient,
  index,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: IngredientCardProps) {
  const isObject = typeof ingredient !== 'string';
  const displayText = formatIngredient(ingredient);

  // Convert string to object when expanding
  const handleExpand = () => {
    if (!isExpanded && typeof ingredient === 'string') {
      // Simple parse: try to extract name (everything after last comma or space)
      onChange({
        name: ingredient.trim(),
      });
    }
    onToggleExpand();
  };

  if (!isExpanded) {
    return (
      <div className="ingredient-card">
        <div className="card-header" onClick={handleExpand} style={{ cursor: 'pointer' }}>
          <span className="drag-handle" style={{ cursor: 'grab' }}>
            ⋮⋮
          </span>
          <span style={{ flex: 1 }}>{displayText}</span>
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
  const obj: IngredientObject =
    typeof ingredient === 'string'
      ? { name: ingredient.trim() }
      : { ...ingredient };

  const updateField = <K extends keyof IngredientObject>(
    field: K,
    value: IngredientObject[K]
  ) => {
    const updated = { ...obj, [field]: value };
    onChange(updated);
  };

  const quantityType =
    typeof obj.quantity === 'object' && obj.quantity !== null ? 'range' : 'exact';

  return (
    <div className="ingredient-card expanded">
      <div className="card-header">
        <span className="drag-handle" style={{ cursor: 'grab' }}>
          ⋮⋮
        </span>
        <span style={{ flex: 1, fontWeight: 600 }}>Ingredient</span>
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
        {/* Quantity, Unit, Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 'var(--space-sm)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
              Quantity
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
              <input
                type="radio"
                checked={quantityType === 'exact'}
                onChange={() => {
                  if (typeof obj.quantity === 'object') {
                    updateField('quantity', obj.quantity.min);
                  } else if (obj.quantity === undefined) {
                    updateField('quantity', 1);
                  }
                }}
                style={{ width: 'auto' }}
              />
              <span style={{ fontSize: 'var(--text-xs)' }}>Exact</span>
              <input
                type="radio"
                checked={quantityType === 'range'}
                onChange={() => {
                  const current = typeof obj.quantity === 'number' ? obj.quantity : 1;
                  updateField('quantity', { min: current, max: current + 1 });
                }}
                style={{ width: 'auto', marginLeft: 'var(--space-sm)' }}
              />
              <span style={{ fontSize: 'var(--text-xs)' }}>Range</span>
            </div>
            {quantityType === 'exact' ? (
              <input
                type="number"
                value={typeof obj.quantity === 'number' ? obj.quantity : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateField('quantity', val === '' ? undefined : Number(val));
                }}
                placeholder="2"
                style={{ width: '100%', marginTop: 'var(--space-xs)' }}
              />
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
                <input
                  type="number"
                  value={typeof obj.quantity === 'object' ? obj.quantity.min : ''}
                  onChange={(e) => {
                    const max = typeof obj.quantity === 'object' ? obj.quantity.max : 1;
                    updateField('quantity', { min: Number(e.target.value), max });
                  }}
                  placeholder="min"
                  style={{ flex: 1 }}
                />
                <span style={{ alignSelf: 'center' }}>to</span>
                <input
                  type="number"
                  value={typeof obj.quantity === 'object' ? obj.quantity.max : ''}
                  onChange={(e) => {
                    const min = typeof obj.quantity === 'object' ? obj.quantity.min : 1;
                    updateField('quantity', { min, max: Number(e.target.value) });
                  }}
                  placeholder="max"
                  style={{ flex: 1 }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
              Unit
            </label>
            <select
              value={obj.unit || ''}
              onChange={(e) => updateField('unit', e.target.value || undefined)}
              style={{ width: '100%' }}
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit || '(none)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
              Name
            </label>
            <input
              type="text"
              value={obj.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="all-purpose flour"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Prep */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
            Prep (optional)
          </label>
          <input
            type="text"
            value={obj.prep || ''}
            onChange={(e) => updateField('prep', e.target.value || undefined)}
            placeholder="sifted, diced, minced, etc."
            style={{ width: '100%' }}
          />
        </div>

        {/* Scaling */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-xs)', color: 'var(--color-text-muted)' }}>
            Scaling
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
              <input
                type="radio"
                name={`scaling-${index}`}
                checked={!obj.toTaste}
                onChange={() => updateField('toTaste', undefined)}
              />
              <span style={{ fontSize: 'var(--text-sm)' }}>Normal</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
              <input
                type="radio"
                name={`scaling-${index}`}
                checked={obj.toTaste === true}
                onChange={() => updateField('toTaste', true)}
              />
              <span style={{ fontSize: 'var(--text-sm)' }}>To taste</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
