'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CreatorMode } from './CreatorMode';
import EntryCards from './EntryCards';
import PasteRecipeEditor from './PasteRecipeEditor';
import BuildRecipeEditor from './BuildRecipeEditor';
import CreatorPreview from './CreatorPreview';
import CreatorExportMenu from './CreatorExportMenu';
import InputMethodToggle from './InputMethodToggle';
import AuthPanel from '@/components/AuthPanel';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import { parseFreeform } from '@/lib/mise/parseFreeform';
import { saveRecipeAction, setRecipePublicAction } from '@/app/actions/recipes';
import { nowIso } from '@/lib/mise/workbenchDoc';
import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { slugify } from '@/lib/utils/slugify';

type InputMethod = 'paste' | 'build';

export default function CreatorPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useState<CreatorMode>('empty');
  const [inputMethod, setInputMethod] = useState<InputMethod>('paste');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [draftText, setDraftText] = useState('');
  const [recipe, setRecipe] = useState<SoustackLiteRecipe>(() => compileLiteRecipe({}));
  const [parseMeta, setParseMeta] = useState<{ confidence: number; mode: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [copySuccess, setCopySuccess] = useState<'json' | null>(null);

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
      // Close auth prompt when user signs in
      if (session?.user) {
        setShowAuthPrompt(false);
      }
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

  // Create WorkbenchDoc from current recipe state
  const createWorkbenchDoc = useCallback((): WorkbenchDoc => {
    return {
      recipe,
      draft: {
        mode: 'structured',
        rawText: draftText,
        ...(parseMeta && {
          lastImport: {
            source: 'paste',
            confidence: parseMeta.confidence,
            mode: parseMeta.mode,
            at: new Date().toISOString(),
          },
        }),
      },
      meta: {
        revision: 0,
        updatedAt: nowIso(),
      },
    };
  }, [recipe, draftText, parseMeta]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    setSaveStatus('saving');
    try {
      const doc = createWorkbenchDoc();
      const result = await saveRecipeAction({
        id: savedRecipeId ?? undefined,
        doc,
      });
      setSavedRecipeId(result.id);
      setIsPublic(result.is_public);
      setPublicId(result.public_id);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        setShowAuthPrompt(true);
        setSaveStatus('idle');
      } else {
        setSaveStatus('error');
        console.error('Save error:', error);
      }
    }
  }, [user, savedRecipeId, createWorkbenchDoc]);

  // Handle copy JSON
  const handleCopyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(recipe, null, 2));
      setCopySuccess('json');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [recipe]);

  // Handle download
  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = slugify(recipe.name || 'recipe') + '.soustack.json';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  }, [recipe]);

  // Handle get shareable link
  const handleGetShareableLink = useCallback(async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    // If not saved, save first
    if (!savedRecipeId) {
      setSaveStatus('saving');
      try {
        const doc = createWorkbenchDoc();
        const result = await saveRecipeAction({
          doc,
        });
        setSavedRecipeId(result.id);
        setIsPublic(result.is_public);
        setPublicId(result.public_id);
        setSaveStatus('saved');
        // Now copy the link
        const url = `${window.location.origin}/r/${result.id}`;
        await navigator.clipboard.writeText(url);
        setCopySuccess('json');
        setTimeout(() => {
          setCopySuccess(null);
          setSaveStatus('idle');
        }, 2000);
      } catch (error: any) {
        setSaveStatus('error');
        console.error('Save error:', error);
      }
      return;
    }

    // Already saved, just copy the link
    try {
      const url = `${window.location.origin}/r/${savedRecipeId}`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('json');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy shareable link:', error);
    }
  }, [user, savedRecipeId, createWorkbenchDoc]);

  // Handle publish
  const handlePublish = useCallback(async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    // If not saved, save first
    if (!savedRecipeId) {
      setSaveStatus('saving');
      try {
        const doc = createWorkbenchDoc();
        const result = await saveRecipeAction({
          doc,
        });
        setSavedRecipeId(result.id);
        setIsPublic(result.is_public);
        setPublicId(result.public_id);
        setSaveStatus('saved');
        // Now publish
        const publishResult = await setRecipePublicAction({
          recipeId: result.id,
          makePublic: true,
        });
        setIsPublic(publishResult.is_public);
        setPublicId(publishResult.public_id);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error: any) {
        setSaveStatus('error');
        console.error('Save/publish error:', error);
      }
      return;
    }

    // Already saved, just toggle publish status
    try {
      const result = await setRecipePublicAction({
        recipeId: savedRecipeId,
        makePublic: !isPublic,
      });
      setIsPublic(result.is_public);
      setPublicId(result.public_id);
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        setShowAuthPrompt(true);
      } else {
        console.error('Publish error:', error);
      }
    }
  }, [user, savedRecipeId, isPublic, createWorkbenchDoc]);

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
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: saveStatus === 'saving' ? 0.6 : 1,
            }}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save'}
          </button>
          <CreatorExportMenu
            recipe={recipe}
            user={user}
            savedRecipeId={savedRecipeId}
            publicId={publicId}
            isPublic={isPublic}
            onCopyJson={handleCopyJson}
            onDownload={handleDownload}
            onGetShareableLink={handleGetShareableLink}
            onPublish={handlePublish}
          />
        </div>
      </div>

      {/* Auth Prompt */}
      {showAuthPrompt && (
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Sign in to save, share, and publish recipes
            </div>
            <button
              onClick={() => setShowAuthPrompt(false)}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#666',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: '12px' }}>
            <AuthPanel />
          </div>
        </div>
      )}

      {/* Copy Success Indicator */}
      {copySuccess === 'json' && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            backgroundColor: '#059669',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          ✓ Copied to clipboard
        </div>
      )}

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
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: saveStatus === 'saving' ? 0.6 : 1,
              }}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save'}
            </button>
            <div style={{ flex: 1 }}>
              <CreatorExportMenu
                recipe={recipe}
                user={user}
                savedRecipeId={savedRecipeId}
                publicId={publicId}
                isPublic={isPublic}
                onCopyJson={handleCopyJson}
                onDownload={handleDownload}
                onGetShareableLink={handleGetShareableLink}
                onPublish={handlePublish}
              />
            </div>
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
