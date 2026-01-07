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
import { saveRecipeAction, setRecipePublicAction } from '@/app/actions/recipes';
import { slugify } from '@/lib/utils/slugify';
import RawDraftEditor from './RawDraftEditor';
import StructuredEditor from './StructuredEditor';
import PreviewTabs from './PreviewTabs';
import ConvertDialog from './ConvertDialog';
import AuthPanel from './AuthPanel';
import EditorTopBar from './EditorTopBar';

const DEBOUNCE_MS = 200;

type WorkbenchProps = {
  initialDoc?: WorkbenchDoc;
  initialRecipeId?: string;
  initialIsPublic?: boolean;
  initialPublicId?: string | null;
};

export default function Workbench({
  initialDoc,
  initialRecipeId,
  initialIsPublic = false,
  initialPublicId = null,
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
  const [copySuccess, setCopySuccess] = useState<
    'json' | 'url' | 'sidecar' | 'private' | 'public' | null
  >(null);
  const [isPublic, setIsPublic] = useState<boolean>(initialIsPublic);
  const [publicId, setPublicId] = useState<string | null>(initialPublicId);
  const [publicStatus, setPublicStatus] = useState<
    'idle' | 'updating' | 'error'
  >('idle');
  const [miseMode, setMiseMode] = useState<'draft' | 'mise'>('draft');

  // Debounced parse and compile - only runs in raw mode
  useEffect(() => {
    if (doc.draft.mode !== 'raw') {
      return; // Don't parse in structured mode
    }

    const timer = setTimeout(() => {
      try {
        // Parse the freeform text
        const parseResult = parseFreeform(doc.draft.rawText);

        // Update doc atomically
        setDoc((prev) => {
          // Compile into always-valid recipe
          // Preserve existing description if it exists
          const compiled = compileLiteRecipe({
            name: parseResult.title,
            description: prev.recipe.description,
            ingredients: parseResult.ingredients,
            instructions: parseResult.instructions,
            meta: {
              confidence: parseResult.confidence,
              mode: parseResult.mode,
            },
          });

          return {
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
          };
        });
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

  const handleNameChange = useCallback((name: string) => {
    setDoc((prev) => {
      const next = {
        ...prev.recipe,
        name: name.trim() || 'Untitled Recipe',
      };
      return {
        ...prev,
        recipe: next,
        meta: {
          revision: prev.meta.revision + 1,
          updatedAt: nowIso(),
        },
      };
    });
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setDoc((prev) => {
      const trimmed = description.trim();
      const next = {
        ...prev.recipe,
        ...(trimmed ? { description: trimmed } : { description: undefined }),
      };
      // Remove description field if empty
      if (!trimmed && 'description' in next) {
        delete next.description;
      }
      return {
        ...prev,
        recipe: next,
        meta: {
          revision: prev.meta.revision + 1,
          updatedAt: nowIso(),
        },
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    setSaveError(null);

    try {
      const result = await saveRecipeAction({
        id: savedRecipeId ?? undefined,
        doc,
      });
      setSavedRecipeId(result.id);
      // Store public status and public_id from response
      setIsPublic(result.is_public);
      setPublicId(result.public_id);
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

  const handleCopyJson = useCallback(async () => {
    try {
      const json = JSON.stringify(doc.recipe, null, 2);
      await navigator.clipboard.writeText(json);
      setCopySuccess('json');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [doc.recipe]);

  const handleDownloadJson = useCallback(() => {
    try {
      const json = JSON.stringify(doc.recipe, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `${slugify(doc.recipe.name)}.soustack.json`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  }, [doc.recipe]);

  const handleCopyUrl = useCallback(async () => {
    if (!savedRecipeId) return;
    try {
      const url = `${window.location.origin}/soustack/recipes/${savedRecipeId}.soustack.json`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('url');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // B3) Non-blocking error feedback (optional - could show toast)
    }
  }, [savedRecipeId]);

  const handleCopySidecarUrl = useCallback(async () => {
    // B5) Safety: never attempt to copy if savedRecipeId is missing
    if (!savedRecipeId) return;
    try {
      // B2) Construct absolute URL using browser origin
      const url = `${window.location.origin}/soustack/recipes/${savedRecipeId}.soustack.json`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('sidecar');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy sidecar URL:', error);
      // B3) Non-blocking error feedback
    }
  }, [savedRecipeId]);

  const handleSetPublic = useCallback(
    async (makePublic: boolean) => {
      if (!savedRecipeId) return;

      setPublicStatus('updating');
      try {
        const result = await setRecipePublicAction({
          recipeId: savedRecipeId,
          makePublic,
        });
        setIsPublic(result.is_public);
        setPublicId(result.public_id);
        setPublicStatus('idle');
      } catch (error: any) {
        if (error.message === 'AUTH_REQUIRED') {
          setShowAuthPrompt(true);
          setPublicStatus('error');
          setTimeout(() => setPublicStatus('idle'), 2000);
        } else if (error.message === 'NOT_FOUND') {
          console.error('Recipe not found:', error);
          setPublicStatus('error');
          setTimeout(() => setPublicStatus('idle'), 2000);
        } else {
          console.error('Failed to set public status:', error);
          setPublicStatus('error');
          setTimeout(() => setPublicStatus('idle'), 2000);
        }
      }
    },
    [savedRecipeId]
  );

  const handleCopyPrivateUrl = useCallback(async () => {
    if (!savedRecipeId) return;
    try {
      const url = `${window.location.origin}/soustack/recipes/${savedRecipeId}.soustack.json`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('private');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy private URL:', error);
    }
  }, [savedRecipeId]);

  const handleCopyPublicUrl = useCallback(async () => {
    if (!publicId) return;
    try {
      const url = `${window.location.origin}/soustack/public/${publicId}.soustack.json`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('public');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy public URL:', error);
    }
  }, [publicId]);

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
      {/* App header */}
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
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
      </header>
      
      {/* Editor top bar */}
      <EditorTopBar
        recipe={doc.recipe}
        miseMode={miseMode}
        onModeChange={setMiseMode}
        onNameChange={handleNameChange}
        onDescriptionChange={handleDescriptionChange}
      />
      
      {/* Action buttons toolbar */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          backgroundColor: '#fafafa',
        }}
      >
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
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '0 12px',
            borderLeft: '1px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
          }}
        >
          <button
            onClick={handleCopyJson}
            style={{
              padding: '6px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: copySuccess === 'json' ? '#059669' : '#000',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {copySuccess === 'json' ? 'Copied ✓' : 'Copy Soustack JSON'}
          </button>
          <button
            onClick={handleDownloadJson}
            style={{
              padding: '6px 12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#000',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Download .soustack.json
          </button>
          {savedRecipeId ? (
            <button
              onClick={handleCopyUrl}
              style={{
                padding: '6px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: copySuccess === 'url' ? '#059669' : '#000',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {copySuccess === 'url' ? 'Copied ✓' : 'Copy link'}
            </button>
          ) : (
            <button
              disabled
              title="Save to enable link"
              style={{
                padding: '6px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                color: '#999',
                cursor: 'not-allowed',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Copy link
            </button>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '0 12px',
            borderLeft: '1px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
          }}
        >
          {savedRecipeId ? (
            <>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => handleSetPublic(e.target.checked)}
                  disabled={publicStatus === 'updating'}
                  style={{ cursor: 'pointer' }}
                />
                <span>
                  {publicStatus === 'updating'
                    ? 'Updating...'
                    : isPublic
                      ? 'Public ✓'
                      : 'Public'}
                </span>
              </label>
              <button
                onClick={handleCopyPrivateUrl}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  color: copySuccess === 'private' ? '#059669' : '#000',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {copySuccess === 'private' ? 'Copied ✓' : 'Copy private sidecar URL'}
              </button>
              {isPublic && publicId ? (
                <button
                  onClick={handleCopyPublicUrl}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    color: copySuccess === 'public' ? '#059669' : '#000',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {copySuccess === 'public' ? 'Copied ✓' : 'Copy public Soustack JSON link'}
                </button>
              ) : isPublic ? (
                <button
                  disabled
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                    color: '#999',
                    cursor: 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  Publishing...
                </button>
              ) : null}
            </>
          ) : (
            <div
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: '#999',
                fontStyle: 'italic',
              }}
            >
              Save to enable publishing
            </div>
          )}
        </div>
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
              miseMode={miseMode}
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
