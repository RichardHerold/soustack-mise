'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { parseFreeform } from '@/lib/mise/parseFreeform';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type PasteRecipeEditorProps = {
  draftText: string;
  onDraftTextChange: (text: string) => void;
  onRecipeChange: (recipe: SoustackLiteRecipe) => void;
  onParseMetaChange: (meta: { confidence: number; mode: string } | null) => void;
  autoParse?: boolean; // If false, don't auto-parse on text change
};

export default function PasteRecipeEditor({
  draftText,
  onDraftTextChange,
  onRecipeChange,
  onParseMetaChange,
  autoParse = true,
}: PasteRecipeEditorProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidRecipeRef = useRef<SoustackLiteRecipe | null>(null);

  // Debounced parsing function
  const handleParse = useCallback(
    (text: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!text.trim()) {
        setIsDetecting(false);
        // Keep last valid recipe if text is empty
        if (lastValidRecipeRef.current) {
          onRecipeChange(lastValidRecipeRef.current);
        }
        onParseMetaChange(null);
        return;
      }

      setIsDetecting(true);

      debounceTimerRef.current = setTimeout(() => {
        try {
          // Parse the freeform text
          const parseResult = parseFreeform(text);

          // Compile into always-valid recipe
          const recipe = compileLiteRecipe({
            name: parseResult.title || undefined,
            ingredients: parseResult.ingredients,
            instructions: parseResult.instructions,
            meta: {
              confidence: parseResult.confidence,
              mode: parseResult.mode,
            },
          });

          // Store as last valid recipe
          lastValidRecipeRef.current = recipe;

          // Update parent state
          onRecipeChange(recipe);
          onParseMetaChange({
            confidence: parseResult.confidence,
            mode: parseResult.mode,
          });
        } catch (error) {
          // Never throw - keep prior recipe and continue
          console.warn('Parse/compile error (non-blocking):', error);
          // Keep last valid recipe on error
          if (lastValidRecipeRef.current) {
            onRecipeChange(lastValidRecipeRef.current);
          }
        } finally {
          setIsDetecting(false);
        }
      }, 500); // 500ms debounce
    },
    [onRecipeChange, onParseMetaChange]
  );

  // Handle textarea change
  const handleTextChange = (text: string) => {
    onDraftTextChange(text);
    if (autoParse) {
      handleParse(text);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div>
        <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
          Paste your recipe below
        </div>
        <div
          style={{
            height: '1px',
            backgroundColor: '#e0e0e0',
            marginBottom: '16px',
          }}
        />
        <textarea
          value={draftText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Paste or type your recipe here..."
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '16px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <div
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#666',
            lineHeight: '1.6',
          }}
        >
          We&apos;ll automatically detect:
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
            <li>Recipe name</li>
            <li>Ingredients</li>
            <li>Instructions</li>
          </ul>
        </div>
        {isDetecting && (
          <div
            style={{
              marginTop: '12px',
              fontSize: '13px',
              color: '#666',
              fontStyle: 'italic',
            }}
          >
            Detecting...
          </div>
        )}
      </div>
    </div>
  );
}
