'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseFreeform } from '@/lib/mise/parseFreeform';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import RawDraftEditor from './RawDraftEditor';
import PreviewTabs from './PreviewTabs';

type WorkbenchState = {
  rawText: string;
  recipe: SoustackLiteRecipe; // always valid
  parse: {
    confidence: number;
    mode: string;
  } | null;
};

const DEBOUNCE_MS = 200;

export default function Workbench() {
  const [rawText, setRawText] = useState('');
  const [recipe, setRecipe] = useState<SoustackLiteRecipe>(() =>
    compileLiteRecipe({})
  );
  const [parse, setParse] = useState<{ confidence: number; mode: string } | null>(null);

  // Debounced parse and compile
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Parse the freeform text
        const parseResult = parseFreeform(rawText);

        // Compile into always-valid recipe
        const compiled = compileLiteRecipe({
          name: parseResult.title,
          ingredients: parseResult.ingredients,
          instructions: parseResult.instructions,
          meta: {
            confidence: parseResult.confidence,
            mode: parseResult.mode,
          },
        });

        // Update state atomically
        setRecipe(compiled);
        setParse({
          confidence: parseResult.confidence,
          mode: parseResult.mode,
        });
      } catch (error) {
        // Should never happen, but if it does, ensure we still have valid state
        console.error('Parse/compile error (should not happen):', error);
        const fallback = compileLiteRecipe({});
        setRecipe(fallback);
        setParse(null);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [rawText]);

  const handleTextChange = useCallback((text: string) => {
    setRawText(text);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          Soustack Mise
        </h1>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
          <RawDraftEditor value={rawText} onChange={handleTextChange} />
        </div>
        <div style={{ flex: 1 }}>
          <PreviewTabs recipe={recipe} parse={parse} />
        </div>
      </div>
    </div>
  );
}

