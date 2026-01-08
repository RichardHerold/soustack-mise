'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { computeCapabilities } from './utils';
import EntrySelector from './EntrySelector';
import SmartTextArea from './SmartTextArea';
import CreatorEditor from './CreatorEditor';
import PreviewPane from './PreviewPane';
import ExportMenu from './ExportMenu';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type EntryMode = 'empty' | 'paste' | 'build' | 'editing';

type RecipeCreatorProps = {
  initialRecipe: SoustackLiteRecipe;
  onRecipeChange: (recipe: SoustackLiteRecipe) => void;
};

export default function RecipeCreator({ initialRecipe, onRecipeChange }: RecipeCreatorProps) {
  const [recipe, setRecipe] = useState<SoustackLiteRecipe>(initialRecipe);
  const [entryMode, setEntryMode] = useState<EntryMode>('empty');
  const [previewMode, setPreviewMode] = useState<'rendered' | 'json'>('rendered');
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check auth status
  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update recipe with implicit capabilities
  const handleRecipeChange = useCallback((next: SoustackLiteRecipe) => {
    const capabilities = computeCapabilities(next);
    const updated = {
      ...next,
      stacks: capabilities,
    };
    setRecipe(updated);
    onRecipeChange(updated);
  }, [onRecipeChange]);

  // Handle entry mode selection
  const handleEntrySelect = (mode: 'paste' | 'build') => {
    setEntryMode(mode);
  };

  // Handle paste processing
  const handlePasteProcess = (parsedRecipe: SoustackLiteRecipe) => {
    handleRecipeChange(parsedRecipe);
    setEntryMode('editing');
  };

  // Handle build mode start
  const handleBuildStart = () => {
    setEntryMode('editing');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 600 }}>🥣 Soustack Creator</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user && (
            <button
              onClick={async () => {
                // TODO: Implement save
                console.log('Save recipe');
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Save
            </button>
          )}
          <ExportMenu recipe={recipe} user={user} />
        </div>
      </div>

      {/* Main Content */}
      {entryMode === 'empty' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <EntrySelector onSelect={handleEntrySelect} />
        </div>
      )}

      {entryMode === 'paste' && (
        <div style={{ flex: 1, padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <SmartTextArea onProcess={handlePasteProcess} />
        </div>
      )}

      {entryMode === 'build' && (
        <div style={{ flex: 1, padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <CreatorEditor recipe={recipe} onChange={handleRecipeChange} onStart={handleBuildStart} />
        </div>
      )}

      {entryMode === 'editing' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            overflow: 'hidden',
          }}
        >
          {/* Editor Pane */}
          <div
            style={{
              flex: isMobile ? 'none' : '0 0 60%',
              display: isMobile && previewMode === 'json' ? 'none' : 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              padding: '24px',
              borderRight: isMobile ? 'none' : '1px solid #e0e0e0',
            }}
          >
            <CreatorEditor recipe={recipe} onChange={handleRecipeChange} />
          </div>

          {/* Preview Pane */}
          <div
            style={{
              flex: isMobile ? 'none' : '0 0 40%',
              display: isMobile && previewMode === 'rendered' ? 'none' : 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: '#fafafa',
            }}
          >
            {isMobile && (
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#fff',
                }}
              >
                <button
                  onClick={() => setPreviewMode('rendered')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderBottom: previewMode === 'rendered' ? '2px solid #000' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: previewMode === 'rendered' ? 600 : 400,
                  }}
                >
                  Editor
                </button>
                <button
                  onClick={() => setPreviewMode('json')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderBottom: previewMode === 'json' ? '2px solid #000' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: previewMode === 'json' ? 600 : 400,
                  }}
                >
                  Preview
                </button>
              </div>
            )}
            <PreviewPane recipe={recipe} mode={previewMode} />
          </div>
        </div>
      )}
    </div>
  );
}
