'use client';

import { useState } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type JsonPreviewProps = {
  recipe: SoustackLiteRecipe;
};

export default function JsonPreview({ recipe }: JsonPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(recipe, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleCopy}
        className="btn btn-ghost"
        style={{
          position: 'absolute',
          top: 'var(--space-sm)',
          right: 'var(--space-sm)',
          fontSize: 'var(--text-xs)',
          zIndex: 10,
        }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre
        style={{
          margin: 0,
          padding: 'var(--space-md)',
          fontSize: 'var(--text-sm)',
          overflow: 'auto',
          maxHeight: '100%',
        }}
      >
        <code>{JSON.stringify(recipe, null, 2)}</code>
      </pre>
    </div>
  );
}
