'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { loadRecipeWithMeta } from '@/lib/db/recipes';
import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';
import { slugify } from '@/lib/utils/slugify';

type RecipeCardProps = {
  id: string;
  title: string;
  updated_at: string;
  is_public?: boolean;
  public_id?: string | null;
};

const PREVIEW_LINES = 3;

export default function RecipeCard({
  id,
  title,
  updated_at,
  is_public = false,
  public_id = null,
}: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [recipeDoc, setRecipeDoc] = useState<WorkbenchDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState<
    'json' | 'private' | 'public' | null
  >(null);

  const handleToggle = useCallback(async () => {
    if (!expanded && !recipeDoc) {
      // Load recipe doc on first expand
      setLoading(true);
      try {
        const { doc } = await loadRecipeWithMeta(id);
        setRecipeDoc(doc);
      } catch (error) {
        console.error('Failed to load recipe:', error);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  }, [expanded, recipeDoc, id]);

  const handleCopyJson = useCallback(async () => {
    if (!recipeDoc) return;
    try {
      const json = JSON.stringify(recipeDoc.recipe, null, 2);
      await navigator.clipboard.writeText(json);
      setCopySuccess('json');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  }, [recipeDoc]);

  const handleCopyPrivateUrl = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/soustack/recipes/${id}.soustack.json`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('private');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, [id]);

  const handleCopyPublicUrl = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!public_id) return;
    try {
      const url = `${window.location.origin}/soustack/public/${public_id}.soustack.json`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('public');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, [public_id]);

  const handleDownloadJson = useCallback(() => {
    if (!recipeDoc) return;
    try {
      const json = JSON.stringify(recipeDoc.recipe, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `${slugify(recipeDoc.recipe.name)}.soustack.json`;
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
  }, [recipeDoc]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const ingredients = recipeDoc
    ? Array.isArray(recipeDoc.recipe.ingredients)
      ? (recipeDoc.recipe.ingredients as string[])
      : []
    : [];
  const instructions = recipeDoc
    ? Array.isArray(recipeDoc.recipe.instructions)
      ? (recipeDoc.recipe.instructions as string[])
      : []
    : [];

  const showAllIngredients = expanded && ingredients.length > PREVIEW_LINES;
  const showAllInstructions = expanded && instructions.length > PREVIEW_LINES;
  const [showAllIng, setShowAllIng] = useState(false);
  const [showAllInst, setShowAllInst] = useState(false);

  const displayedIngredients = showAllIng
    ? ingredients
    : ingredients.slice(0, PREVIEW_LINES);
  const displayedInstructions = showAllInst
    ? instructions
    : instructions.slice(0, PREVIEW_LINES);

  return (
    <div className="card">
      <div
        className="cardHeader"
        style={{
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={handleToggle}
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
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              {title || 'Untitled Recipe'}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#666',
                marginBottom: '8px',
              }}
            >
              Updated {formatDate(updated_at)}
            </div>
            {is_public && (
              <span className="chip chipSuccess">Public</span>
            )}
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#666',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            ▼
          </div>
        </div>
      </div>

      {expanded && (
        <div className="cardBody">
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              Loading recipe...
            </div>
          ) : recipeDoc ? (
            <>
              {ingredients.length > 0 && (
                <section style={{ marginBottom: '24px' }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#666',
                      marginBottom: '12px',
                    }}
                  >
                    Ingredients
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {displayedIngredients.map((ingredient, idx) => (
                      <li
                        key={idx}
                        style={{
                          marginBottom: '6px',
                          fontSize: '15px',
                          lineHeight: '1.6',
                        }}
                      >
                        {String(ingredient)}
                      </li>
                    ))}
                  </ul>
                  {ingredients.length > PREVIEW_LINES && !showAllIng && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllIng(true);
                      }}
                      className="button buttonSecondary"
                      style={{ marginTop: '8px', fontSize: '13px' }}
                    >
                      Show all ({ingredients.length})
                    </button>
                  )}
                </section>
              )}

              {instructions.length > 0 && (
                <section style={{ marginBottom: '24px' }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#666',
                      marginBottom: '12px',
                    }}
                  >
                    Instructions
                  </h3>
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    {displayedInstructions.map((instruction, idx) => (
                      <li
                        key={idx}
                        style={{
                          marginBottom: '8px',
                          fontSize: '15px',
                          lineHeight: '1.6',
                        }}
                      >
                        {String(instruction)}
                      </li>
                    ))}
                  </ol>
                  {instructions.length > PREVIEW_LINES && !showAllInst && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllInst(true);
                      }}
                      className="button buttonSecondary"
                      style={{ marginTop: '8px', fontSize: '13px' }}
                    >
                      Show all ({instructions.length})
                    </button>
                  )}
                </section>
              )}

              <div
                style={{
                  paddingTop: '16px',
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <Link
                  href={`/r/${id}`}
                  className="button buttonSecondary"
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </Link>
                <Link
                  href={`/recipes/${id}`}
                  className="button buttonPrimary"
                  onClick={(e) => e.stopPropagation()}
                >
                  Edit in Mise
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyJson();
                  }}
                  className="button buttonSecondary"
                >
                  {copySuccess === 'json' ? 'Copied ✓' : 'Copy JSON'}
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="button buttonSecondary"
                >
                  Download JSON
                </button>
                <button
                  onClick={handleCopyPrivateUrl}
                  className="button buttonSecondary"
                >
                  {copySuccess === 'private' ? 'Copied ✓' : 'Copy private link'}
                </button>
                {is_public && public_id && (
                  <button
                    onClick={handleCopyPublicUrl}
                    className="button buttonSecondary"
                  >
                    {copySuccess === 'public' ? 'Copied ✓' : 'Copy public link'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              Failed to load recipe
            </div>
          )}
        </div>
      )}
    </div>
  );
}

