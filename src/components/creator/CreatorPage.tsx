'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CreatorMode } from './CreatorMode';
import EntryCards from './EntryCards';
import PasteRecipeEditor from './PasteRecipeEditor';
import BuildRecipeEditor from './BuildRecipeEditor';
import CreatorPreview from './CreatorPreview';
import InputMethodToggle from './InputMethodToggle';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import { parseFreeform } from '@/lib/mise/parseFreeform';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type InputMethod = 'paste' | 'build';

export default function CreatorPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useState<CreatorMode>('empty');
  const [inputMethod, setInputMethod] = useState<InputMethod>('paste');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [draftText, setDraftText] = useState('');
  const [recipe, setRecipe] = useState<SoustackLiteRecipe>(() => compileLiteRecipe({}));
  const [parseMeta, setParseMeta] = useState<{ confidence: number; mode: string } | null>(null);

  // Initialize inputMethod when mode changes
  useEffect(() => {
    if (mode === 'paste') {
      setInputMethod('paste');
    } else if (mode === 'scratch') {
      setInputMethod('build');
    }
  }, [mode]);

  // Manual re-parse function
  const handleReParse = useCallback(() => {
    if (!draftText.trim()) return;

    try {
      const parseResult = parseFreeform(draftText);
      const newRecipe = compileLiteRecipe({
        name: parseResult.title || undefined,
        ingredients: parseResult.ingredients,
        instructions: parseResult.instructions,
        meta: {
          confidence: parseResult.confidence,
          mode: parseResult.mode,
        },
      });
      setRecipe(newRecipe);
      setParseMeta({
        confidence: parseResult.confidence,
        mode: parseResult.mode,
      });
    } catch (error) {
      console.warn('Re-parse error (non-blocking):', error);
    }
  }, [draftText]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          <button
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
          <button
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Export <span style={{ fontSize: '10px' }}>▼</span>
          </button>
        </div>
      </div>

      {/* Name and Description - only show when not in empty mode */}
      {mode !== 'empty' && (
        <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={recipe.name || ''}
              onChange={(e) => {
                setRecipe({ ...recipe, name: e.target.value || 'Untitled Recipe' });
              }}
              placeholder="Recipe Name"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontSize: '16px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <textarea
              value={recipe.description || ''}
              onChange={(e) => {
                setRecipe({ ...recipe, description: e.target.value || undefined });
              }}
              placeholder="Description (optional)"
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Main Body */}
      {mode === 'empty' ? (
        /* Entry Experience - show 3 cards */
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <EntryCards
            onSelect={(selectedMode) => {
              setMode(selectedMode);
              if (selectedMode === 'paste') {
                setInputMethod('paste');
              } else if (selectedMode === 'scratch') {
                setInputMethod('build');
              }
            }}
          />
        </div>
      ) : isMobile ? (
        <>
          {/* Mobile Tab Switcher */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fff',
            }}
          >
            <button
              onClick={() => setActiveTab('editor')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderBottom: activeTab === 'editor' ? '2px solid #000' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'editor' ? 600 : 400,
                color: activeTab === 'editor' ? '#000' : '#666',
              }}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderBottom: activeTab === 'preview' ? '2px solid #000' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'preview' ? 600 : 400,
                color: activeTab === 'preview' ? '#000' : '#666',
              }}
            >
              Preview
            </button>
          </div>

          {/* Mobile Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {activeTab === 'editor' && (
              <div>
                {/* Show toggle when in paste mode or scratch mode */}
                {(mode === 'paste' || mode === 'scratch') && (
                  <InputMethodToggle
                    inputMethod={inputMethod}
                    onChange={(method) => {
                      setInputMethod(method);
                      // When switching to build, keep current recipe (no conversion modal)
                    }}
                    showReParse={inputMethod === 'build' && draftText.trim().length > 0}
                    onReParse={handleReParse}
                  />
                )}
                {inputMethod === 'paste' && (
                  <PasteRecipeEditor
                    draftText={draftText}
                    onDraftTextChange={setDraftText}
                    onRecipeChange={setRecipe}
                    onParseMetaChange={setParseMeta}
                    autoParse={true}
                  />
                )}
                {inputMethod === 'build' && (
                  <BuildRecipeEditor recipe={recipe} onChange={setRecipe} />
                )}
                {mode === 'import' && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                    Import mode editor goes here
                  </div>
                )}
              </div>
            )}
            {activeTab === 'preview' && <CreatorPreview recipe={recipe} />}
          </div>

          {/* Mobile Footer with Save + Export */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between',
            }}
          >
            <button
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Save
            </button>
            <button
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              Export <span style={{ fontSize: '10px' }}>▼</span>
            </button>
          </div>
        </>
      ) : (
        /* Desktop Two-Pane Layout */
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* Editor Pane (60%) */}
          <div
            style={{
              flex: '0 0 60%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              padding: '24px',
              borderRight: '1px solid #e0e0e0',
            }}
          >
            {/* Show toggle when in paste mode or scratch mode */}
            {(mode === 'paste' || mode === 'scratch') && (
              <InputMethodToggle
                inputMethod={inputMethod}
                onChange={(method) => {
                  setInputMethod(method);
                  // When switching to build, keep current recipe (no conversion modal)
                }}
                showReParse={inputMethod === 'build' && draftText.trim().length > 0}
                onReParse={handleReParse}
              />
            )}
            {inputMethod === 'paste' && (
              <PasteRecipeEditor
                draftText={draftText}
                onDraftTextChange={setDraftText}
                onRecipeChange={setRecipe}
                onParseMetaChange={setParseMeta}
                autoParse={true}
              />
            )}
            {inputMethod === 'build' && (
              <BuildRecipeEditor recipe={recipe} onChange={setRecipe} />
            )}
            {mode === 'import' && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                Import mode editor goes here
              </div>
            )}
          </div>

          {/* Preview Pane (40%) */}
          <div
            style={{
              flex: '0 0 40%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: '#fafafa',
            }}
          >
            <CreatorPreview recipe={recipe} />
          </div>
        </div>
      )}
    </div>
  );
}
