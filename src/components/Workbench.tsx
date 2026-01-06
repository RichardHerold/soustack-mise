'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { parseFreeform } from '@/lib/mise/parseFreeform';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';
import {
  createEmptyWorkbenchDoc,
  nowIso,
} from '@/lib/mise/workbenchDoc';
import { saveRecipe } from '@/lib/db/recipes';
import RawDraftEditor from './RawDraftEditor';
import StructuredEditor from './StructuredEditor';
import PreviewTabs from './PreviewTabs';
import ConvertDialog from './ConvertDialog';
import AuthPanel from './AuthPanel';

const DEBOUNCE_MS = 200;

type WorkbenchProps = {
  initialDoc?: WorkbenchDoc;
  initialRecipeId?: string;
};

export default function Workbench({
  initialDoc,
  initialRecipeId,
}: WorkbenchProps) {
  // Initialize with initialDoc if provided, otherwise empty
  const [doc, setDoc] = useState<WorkbenchDoc>(() => {
    if (initialDoc) {
      // Validate that initialDoc has required structure, fallback if malformed
      try {
        if (
          initialDoc.recipe &&
          initialDoc.draft &&
          initialDoc.meta &&
          typeof initialDoc.recipe.name === 'string'
        ) {
          return initialDoc;
        }
      } catch {
        // Fall through to empty doc
      }
    }
    return createEmptyWorkbenchDoc();
  });

  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | undefined>(
    initialRecipeId
  );
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'auth_required' | 'error'
  >('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Debounced parse and compile - only runs in raw mode
  useEffect(() => {
    if (doc.draft.mode !== 'raw') {
      return; // Don't parse in structured mode
    }

    const timer = setTimeout(() => {
      try {
        // Parse the freeform text
        const parseResult = parseFreeform(doc.draft.rawText);

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

        // Update doc atomically
        setDoc((prev) => ({
          ...prev,
          recipe: compiled,
          draft: {
            ...prev.draft,
            lastImport: {
              source: 'manual',
              confidence: parseResult.confidence,
              mode: parseResult.mode,
              at: nowIso(),
            },
          },
          meta: {
            revision: prev.meta.revision + 1,
            updatedAt: nowIso(),
          },
        }));
      } catch (error) {
        // Should never happen, but if it does, ensure we still have valid state
        console.error('Parse/compile error (should not happen):', error);
        // Keep previous doc state - don't update on error
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [doc.draft.rawText, doc.draft.mode]);

  const handleRawTextChange = useCallback((text: string) => {
    setDoc((prev) => {
      if (prev.draft.mode !== 'raw') {
        return prev; // Don't update raw text in structured mode
      }
      return {
        ...prev,
        draft: {
          ...prev.draft,
          rawText: text,
        },
      };
    });
  }, []);

  const handleRecipeChange = useCallback((recipe: typeof doc.recipe) => {
    setDoc((prev) => ({
      ...prev,
      recipe,
      meta: {
        revision: prev.meta.revision + 1,
        updatedAt: nowIso(),
      },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    setSaveError(null);

    try {
      const result = await saveRecipe({
        id: savedRecipeId,
        doc,
      });
      setSavedRecipeId(result.id);
      setSaveStatus('saved');
      // Clear saved status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        setSaveStatus('auth_required');
        setShowAuthPrompt(true);
      } else {
        setSaveStatus('error');
        setSaveError(error.message || 'Failed to save recipe');
      }
    }
  }, [doc, savedRecipeId]);

  const handleConvert = useCallback((preserveProse: boolean) => {
    setDoc((prev) => {
      const now = nowIso();
      const lastImport = prev.draft.lastImport || {
        source: 'manual' as const,
        confidence: prev.recipe['x-mise']?.parse?.confidence || 0,
        mode: prev.recipe['x-mise']?.parse?.mode || 'unknown',
        at: now,
      };
      const next: WorkbenchDoc = {
        ...prev,
        draft: {
          mode: 'structured',
          rawText: prev.draft.rawText, // Keep as snapshot
          lastImport,
        },
        meta: {
          revision: prev.meta.revision + 1,
          updatedAt: now,
        },
      };

      // If prose preservation is ON, store it in both places
      if (preserveProse) {
        const proseData = {
          text: prev.draft.rawText,
          format: 'plain' as const,
          capturedAt: now,
        };

        next.extensions = {
          prose: proseData,
        };

        // Also store in recipe's x-mise
        next.recipe = {
          ...prev.recipe,
          'x-mise': {
            ...prev.recipe['x-mise'],
            prose: proseData,
          },
        };
      }

      return next;
    });

    setShowConvertDialog(false);
  }, []);

  // Get parse metadata from recipe or draft
  const parseMetadata = doc.recipe['x-mise']?.parse
    ? {
        confidence: doc.recipe['x-mise'].parse.confidence,
        mode: doc.recipe['x-mise'].parse.mode,
      }
    : doc.draft.lastImport
      ? {
          confidence: doc.draft.lastImport.confidence,
          mode: doc.draft.lastImport.mode,
        }
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            Soustack Mise
          </h1>
          <Link
            href="/recipes"
            style={{
              fontSize: '14px',
              color: '#666',
              textDecoration: 'none',
            }}
          >
            My Recipes
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {doc.draft.mode === 'raw' && (
            <button
              onClick={() => setShowConvertDialog(true)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#000',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Convert
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor:
                saveStatus === 'saved' ? '#059669' : '#000',
              color: '#fff',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: saveStatus === 'saving' ? 0.5 : 1,
            }}
          >
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
                ? 'Saved ✓'
                : 'Save'}
          </button>
        </div>
      </header>
      {showAuthPrompt && (
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fef3c7',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Sign in to save recipes
              </div>
              <AuthPanel />
            </div>
            <button
              onClick={() => {
                setShowAuthPrompt(false);
                setSaveStatus('idle');
              }}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#666',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      {saveStatus === 'error' && saveError && (
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            fontSize: '14px',
          }}
        >
          Error: {saveError}
          <button
            onClick={() => {
              setSaveStatus('idle');
              setSaveError(null);
            }}
            style={{
              marginLeft: '12px',
              padding: '4px 8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#dc2626',
              textDecoration: 'underline',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
          {doc.draft.mode === 'raw' ? (
            <RawDraftEditor
              value={doc.draft.rawText}
              onChange={handleRawTextChange}
            />
          ) : (
            <StructuredEditor
              recipe={doc.recipe}
              onChange={handleRecipeChange}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <PreviewTabs recipe={doc.recipe} parse={parseMetadata} />
        </div>
      </div>
      {showConvertDialog && (
        <ConvertDialog
          onConfirm={handleConvert}
          onCancel={() => setShowConvertDialog(false)}
        />
      )}
    </div>
  );
}
