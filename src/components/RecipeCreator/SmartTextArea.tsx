'use client';

import { useState, useCallback, useRef } from 'react';
import { parseFreeform } from '@/lib/mise/parseFreeform';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type SmartTextAreaProps = {
  onProcess: (recipe: SoustackLiteRecipe) => void;
};

export default function SmartTextArea({ onProcess }: SmartTextAreaProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    },
    []
  );

  const handleProcess = useCallback(() => {
    if (!text.trim()) return;

    setIsProcessing(true);
    // Small delay for UX
    setTimeout(() => {
      const parsed = parseFreeform(text);
      const recipe = compileLiteRecipe({
        name: parsed.title || undefined,
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        meta: {
          confidence: parsed.confidence,
          mode: parsed.mode,
        },
      });
      setIsProcessing(false);
      onProcess(recipe);
    }, 300);
  }, [text, onProcess]);

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
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Paste or type your recipe here...

We'll automatically detect:
• Recipe name
• Ingredients
• Instructions"
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
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleProcess}
          disabled={!text.trim() || isProcessing}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: text.trim() && !isProcessing ? '#000' : '#ccc',
            color: '#fff',
            cursor: text.trim() && !isProcessing ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500,
            opacity: text.trim() && !isProcessing ? 1 : 0.6,
          }}
        >
          {isProcessing ? '⏳ Processing...' : 'Process Recipe →'}
        </button>
      </div>
    </div>
  );
}
