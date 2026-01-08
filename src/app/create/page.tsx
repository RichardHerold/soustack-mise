'use client';

import { useState, useEffect } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import { useRecipeConverter } from '@/hooks/useRecipeConverter';
import RecipeCreator from '@/components/creator/RecipeCreator';

type Mode = 'choose' | 'paste' | 'edit';

function ChooseMode({
  onPaste,
  onScratch,
}: {
  onPaste: () => void;
  onScratch: () => void;
}) {
  return (
    <div className="choose-mode">
      <h2>How would you like to start?</h2>

      <div className="mode-cards">
        <button className="mode-card" onClick={onPaste}>
          <span className="mode-icon">📋</span>
          <strong>Paste & Convert</strong>
          <p>Paste recipe text from anywhere. AI will extract ingredients, steps, and timing.</p>
          <span className="mode-tag">~2 seconds</span>
        </button>

        <button className="mode-card" onClick={onScratch}>
          <span className="mode-icon">✏️</span>
          <strong>Start from Scratch</strong>
          <p>Build your recipe step by step with structured fields.</p>
          <span className="mode-tag">No AI needed</span>
        </button>
      </div>
    </div>
  );
}

function PasteMode({
  text,
  onTextChange,
  onConvert,
  state,
}: {
  text: string;
  onTextChange: (text: string) => void;
  onConvert: () => void;
  state: ReturnType<typeof useRecipeConverter>['state'];
}) {
  const isConverting = state.status === 'converting';
  const hasError = state.status === 'error';

  return (
    <div className="paste-mode">
      <h2>Paste your recipe</h2>
      <p className="hint">
        Paste any recipe — from a website, a cookbook, or your notes. We'll automatically extract
        the structure.
      </p>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={isConverting}
        rows={18}
        placeholder={`Example:

Chocolate Chip Cookies

Ingredients:
2 cups all-purpose flour
1 tsp baking soda
1 cup butter, softened
3/4 cup sugar
2 large eggs
2 cups chocolate chips

Instructions:
1. Preheat oven to 375°F
2. Mix flour and baking soda in a bowl
3. Cream butter and sugar until fluffy, about 2 minutes
4. Beat in eggs one at a time
5. Gradually blend in flour mixture
6. Stir in chocolate chips
7. Drop rounded tablespoons onto baking sheets
8. Bake 9-11 minutes until golden brown`}
      />

      {hasError && (
        <div className="error-message">
          <span>⚠️ {state.message}</span>
        </div>
      )}

      <div className="paste-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={onConvert}
          disabled={!text.trim() || isConverting}
        >
          {isConverting ? (
            <>
              <span className="spinner" />
              Converting...
            </>
          ) : (
            '✨ Convert to Structured'
          )}
        </button>
      </div>

      <p className="fine-print">
        Free • Powered by AI • Your text is processed but not stored
      </p>
    </div>
  );
}

export default function CreatePage() {
  const [mode, setMode] = useState<Mode>('choose');
  const [pasteText, setPasteText] = useState('');
  const [recipe, setRecipe] = useState<SoustackLiteRecipe | null>(null);
  const { state, convert, reset } = useRecipeConverter();

  const handlePasteAndConvert = async () => {
    await convert(pasteText);
  };

  const handleStartFromScratch = () => {
    setRecipe(compileLiteRecipe({ name: '', ingredients: [''], instructions: [''] }));
    setMode('edit');
  };

  const handleStartOver = () => {
    setMode('choose');
    setRecipe(null);
    setPasteText('');
    reset();
  };

  // When conversion succeeds, move to edit mode
  useEffect(() => {
    if (state.status === 'success' && state.recipe && mode === 'paste') {
      setRecipe(state.recipe);
      setMode('edit');
    }
  }, [state.status, state.recipe, mode]);

  return (
    <div className="create-page">
      {/* Header - always visible */}
      <header className="create-header">
        <h1>🥣 Soustack Creator</h1>
        {mode !== 'choose' && (
          <button className="btn btn-ghost" onClick={handleStartOver}>
            ← Start over
          </button>
        )}
      </header>

      {/* Step 1: Choose mode */}
      {mode === 'choose' && (
        <ChooseMode onPaste={() => setMode('paste')} onScratch={handleStartFromScratch} />
      )}

      {/* Step 2: Paste and convert */}
      {mode === 'paste' && (
        <PasteMode
          text={pasteText}
          onTextChange={setPasteText}
          onConvert={handlePasteAndConvert}
          state={state}
        />
      )}

      {/* Step 3: Edit */}
      {mode === 'edit' && recipe && (
        <RecipeCreator initialRecipe={recipe} onSave={(updated) => setRecipe(updated)} />
      )}
    </div>
  );
}
