'use client';

import { useState } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import IngredientsList from './IngredientsList';
import InstructionsList from './InstructionsList';
import ExportMenu from './ExportMenu';
import JsonPreview from './JsonPreview';

type RecipeCreatorProps = {
  initialRecipe: SoustackLiteRecipe;
  onSave?: (recipe: SoustackLiteRecipe) => void;
  savedRecipeId?: string | null;
};

export default function RecipeCreator({
  initialRecipe,
  onSave,
  savedRecipeId,
}: RecipeCreatorProps) {
  const [recipe, setRecipe] = useState<SoustackLiteRecipe>(initialRecipe);
  const [previewMode, setPreviewMode] = useState<'rendered' | 'json'>('json');

  const updateRecipe = (updates: Partial<SoustackLiteRecipe>) => {
    const updated = { ...recipe, ...updates };
    setRecipe(updated);
    onSave?.(updated);
  };

  const handleNameChange = (name: string) => {
    updateRecipe({ name: name || 'Untitled Recipe' });
  };

  const handleDescriptionChange = (description: string) => {
    updateRecipe({ description: description || undefined });
  };

  const handleIngredientsChange = (ingredients: unknown[]) => {
    updateRecipe({ ingredients });
  };

  const handleInstructionsChange = (instructions: unknown[]) => {
    updateRecipe({ instructions });
  };

  return (
    <div className="creator-layout">
      {/* Header */}
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={recipe.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Recipe Name"
            style={{
              width: '100%',
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              border: 'none',
              borderBottom: '2px solid transparent',
              padding: 'var(--space-sm) 0',
              outline: 'none',
              backgroundColor: 'transparent',
            }}
            onFocus={(e) => {
              e.target.style.borderBottomColor = 'var(--color-border)';
            }}
            onBlur={(e) => {
              e.target.style.borderBottomColor = 'transparent';
            }}
          />
        </div>
        <ExportMenu recipe={recipe} savedRecipeId={savedRecipeId} />
      </div>

      {/* Description */}
      <div
        style={{
          gridColumn: '1 / -1',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-xs)',
          }}
        >
          Description (optional)
        </label>
        <textarea
          value={recipe.description || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="The best cookies you'll ever make"
          rows={2}
          style={{ width: '100%' }}
        />
      </div>

      {/* Editor Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <IngredientsList
          ingredients={(recipe.ingredients || []) as (string | unknown)[]}
          onChange={handleIngredientsChange}
        />
        <InstructionsList
          instructions={(recipe.instructions || []) as (string | unknown)[]}
          onChange={handleInstructionsChange}
        />
      </div>

      {/* Preview Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {/* Preview Mode Toggle */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <button
            onClick={() => setPreviewMode('rendered')}
            className="btn btn-ghost"
            style={{
              flex: 1,
              borderRadius: 0,
              border: 'none',
              borderBottom:
                previewMode === 'rendered' ? '2px solid var(--color-text)' : '2px solid transparent',
              fontWeight: previewMode === 'rendered' ? 600 : 400,
            }}
          >
            Rendered
          </button>
          <button
            onClick={() => setPreviewMode('json')}
            className="btn btn-ghost"
            style={{
              flex: 1,
              borderRadius: 0,
              border: 'none',
              borderBottom:
                previewMode === 'json' ? '2px solid var(--color-text)' : '2px solid transparent',
              fontWeight: previewMode === 'json' ? 600 : 400,
            }}
          >
            JSON
          </button>
        </div>

        {/* Preview Content */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: '400px' }}>
          {previewMode === 'json' ? (
            <JsonPreview recipe={recipe} />
          ) : (
            <div style={{ padding: 'var(--space-lg)' }}>
              <h2 style={{ marginBottom: 'var(--space-md)' }}>{recipe.name}</h2>
              {recipe.description && (
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
                  {recipe.description}
                </p>
              )}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Ingredients</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {((recipe.ingredients || []) as unknown[]).map((ing, idx) => {
                    if (typeof ing === 'string') {
                      return (
                        <li key={idx} style={{ marginBottom: 'var(--space-sm)' }}>
                          {ing}
                        </li>
                      );
                    }
                    if (typeof ing === 'object' && ing !== null && 'name' in ing) {
                      const parts: string[] = [];
                      if ('quantity' in ing && ing.quantity !== undefined) {
                        if (typeof ing.quantity === 'number') {
                          parts.push(String(ing.quantity));
                        } else if (
                          typeof ing.quantity === 'object' &&
                          'min' in ing.quantity &&
                          'max' in ing.quantity
                        ) {
                          parts.push(`${ing.quantity.min}-${ing.quantity.max}`);
                        }
                      }
                      if ('unit' in ing && ing.unit) {
                        parts.push(String(ing.unit));
                      }
                      parts.push(String(ing.name));
                      if ('prep' in ing && ing.prep) {
                        parts.push(String(ing.prep));
                      }
                      if ('toTaste' in ing && ing.toTaste) {
                        parts.push('(to taste)');
                      }
                      return (
                        <li key={idx} style={{ marginBottom: 'var(--space-sm)' }}>
                          {parts.join(' ')}
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>
              <div>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Instructions</h3>
                <ol style={{ paddingLeft: 'var(--space-lg)' }}>
                  {((recipe.instructions || []) as unknown[]).map((inst, idx) => {
                    const text = typeof inst === 'string' ? inst : inst && typeof inst === 'object' && 'text' in inst ? String(inst.text) : '';
                    const timing =
                      typeof inst === 'object' &&
                      inst !== null &&
                      'timing' in inst &&
                      inst.timing
                        ? inst.timing
                        : null;
                    return (
                      <li key={idx} style={{ marginBottom: 'var(--space-md)' }}>
                        <div>{text}</div>
                        {timing &&
                          typeof timing === 'object' &&
                          'duration' in timing &&
                          timing.duration && (
                            <div
                              style={{
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text-muted)',
                                marginTop: 'var(--space-xs)',
                              }}
                            >
                              ⏱️{' '}
                              {'minutes' in timing.duration
                                ? `${timing.duration.minutes} minutes`
                                : 'minMinutes' in timing.duration
                                  ? `${timing.duration.minMinutes}-${timing.duration.maxMinutes} minutes`
                                  : ''}
                              {timing.activity && ` (${timing.activity})`}
                              {timing.completionCue && ` until ${timing.completionCue}`}
                            </div>
                          )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
