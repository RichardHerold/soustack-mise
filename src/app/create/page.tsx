'use client';

import { useState, useEffect } from 'react';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import { useRecipeConverter } from '@/hooks/useRecipeConverter';
import RecipeCreator from '@/components/creator/RecipeCreator';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

export default function CreatePage() {
  const [mode, setMode] = useState<'choose' | 'paste' | 'edit'>('choose');
  const [pasteText, setPasteText] = useState('');
  const [recipe, setRecipe] = useState<SoustackLiteRecipe | null>(null);
  const { state, convert } = useRecipeConverter();

  // Handle conversion success
  useEffect(() => {
    if (state.status === 'success' && state.recipe && mode === 'paste') {
      setRecipe(state.recipe);
      setMode('edit');
    }
  }, [state.status, state.recipe, mode]);

  // Mode: choose
  if (mode === 'choose') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-2xl)',
        }}
      >
        <h1 style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
          Create a Recipe
        </h1>
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            flexDirection: 'column',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          <button
            onClick={() => setMode('paste')}
            className="btn btn-primary"
            style={{ padding: 'var(--space-lg)', fontSize: 'var(--text-lg)' }}
          >
            Paste & Convert
          </button>
          <button
            onClick={() => {
              const emptyRecipe = compileLiteRecipe({});
              setRecipe(emptyRecipe);
              setMode('edit');
            }}
            className="btn btn-secondary"
            style={{ padding: 'var(--space-lg)', fontSize: 'var(--text-lg)' }}
          >
            Start from Scratch
          </button>
        </div>
      </div>
    );
  }

  // Mode: paste
  if (mode === 'paste') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-xl)',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <button
            onClick={() => {
              setMode('choose');
              setPasteText('');
            }}
            className="btn btn-ghost"
            style={{ marginBottom: 'var(--space-md)' }}
          >
            ← Back
          </button>
          <h1 style={{ marginBottom: 'var(--space-md)' }}>Paste Recipe Text</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
            Paste your recipe text below and we'll convert it to structured format.
          </p>
        </div>

        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your recipe here..."
          rows={15}
          style={{
            width: '100%',
            marginBottom: 'var(--space-lg)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
          }}
        />

        {state.status === 'converting' && (
          <div
            style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-lg)',
              textAlign: 'center',
            }}
          >
            Converting recipe...
          </div>
        )}

        {state.status === 'error' && (
          <div
            style={{
              padding: 'var(--space-md)',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            {state.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setMode('choose');
              setPasteText('');
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => convert(pasteText)}
            disabled={state.status === 'converting' || !pasteText.trim()}
            className="btn btn-primary"
          >
            {state.status === 'converting' ? 'Converting...' : 'Convert'}
          </button>
        </div>

      </div>
    );
  }

  // Mode: edit
  if (mode === 'edit' && recipe) {
    return (
      <div style={{ minHeight: '100vh', padding: 'var(--space-lg)' }}>
        <RecipeCreator
          initialRecipe={recipe}
          onSave={(updated) => setRecipe(updated)}
        />
      </div>
    );
  }

  return null;
}
