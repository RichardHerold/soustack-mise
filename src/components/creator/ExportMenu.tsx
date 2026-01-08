'use client';

import { useState, useRef, useEffect } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { slugify } from '@/lib/utils/slugify';

type ExportMenuProps = {
  recipe: SoustackLiteRecipe;
  savedRecipeId?: string | null;
};

export default function ExportMenu({ recipe, savedRecipeId }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(recipe, null, 2));
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([JSON.stringify(recipe, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(recipe.name || 'recipe')}.soustack.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!savedRecipeId) return;
    try {
      const url = `${window.location.origin}/r/${savedRecipeId}`;
      await navigator.clipboard.writeText(url);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
      >
        Export <span style={{ fontSize: 'var(--text-xs)' }}>▼</span>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 'var(--space-xs)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '160px',
            zIndex: 1000,
          }}
        >
          <button
            onClick={handleCopyJson}
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 0,
              border: 'none',
            }}
          >
            📋 Copy JSON
          </button>
          <button
            onClick={handleDownload}
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 0,
              border: 'none',
            }}
          >
            📄 Download .json
          </button>
          <button
            onClick={handleCopyLink}
            disabled={!savedRecipeId}
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 0,
              border: 'none',
              opacity: savedRecipeId ? 1 : 0.5,
              cursor: savedRecipeId ? 'pointer' : 'not-allowed',
            }}
          >
            🔗 Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
