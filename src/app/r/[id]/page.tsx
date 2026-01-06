'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadRecipeForView } from '@/lib/db/recipes';
import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';
import { slugify } from '@/lib/utils/slugify';

export default function RecipeViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [recipeData, setRecipeData] = useState<{
    doc: WorkbenchDoc;
    is_public: boolean;
    public_id: string | null;
    is_owner: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<
    'json' | 'private' | 'public' | null
  >(null);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadRecipeForView(id);
      if (!data) {
        setError('Recipe not found');
      } else {
        setRecipeData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = async () => {
    if (!recipeData) return;
    try {
      const json = JSON.stringify(recipeData.doc.recipe, null, 2);
      await navigator.clipboard.writeText(json);
      setCopySuccess('json');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  const handleDownloadJson = () => {
    if (!recipeData) return;
    try {
      const json = JSON.stringify(recipeData.doc.recipe, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `${slugify(recipeData.doc.recipe.name)}.soustack.json`;
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
  };

  const handleCopyPrivateUrl = async () => {
    try {
      const url = `${window.location.origin}/soustack/recipes/${id}.soustack.json`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('private');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleCopyPublicUrl = async () => {
    if (!recipeData?.public_id) return;
    try {
      const url = `${window.location.origin}/soustack/public/${recipeData.public_id}.soustack.json`;
      await navigator.clipboard.writeText(url);
      setCopySuccess('public');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#666',
        }}
      >
        Loading recipe...
      </div>
    );
  }

  if (error || !recipeData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '16px', color: '#dc2626' }}>
          {error || 'Recipe not found'}
        </div>
        <Link href="/recipes" className="button buttonPrimary">
          Back to Recipes
        </Link>
      </div>
    );
  }

  const ingredients = Array.isArray(recipeData.doc.recipe.ingredients)
    ? (recipeData.doc.recipe.ingredients as string[])
    : [];
  const instructions = Array.isArray(recipeData.doc.recipe.instructions)
    ? (recipeData.doc.recipe.instructions as string[])
    : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <header
        style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link
                href="/recipes"
                style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                }}
              >
                ← Back
              </Link>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                {recipeData.doc.recipe.name}
              </h1>
              {recipeData.is_public && (
                <span className="chip chipSuccess">Public</span>
              )}
            </div>
            {recipeData.is_owner && (
              <Link
                href={`/recipes/${id}`}
                className="button buttonPrimary"
              >
                Edit in Mise
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          {/* Ingredients Card */}
          <div className="card" style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
            <div className="cardHeader">
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#666',
                }}
              >
                Ingredients
              </h2>
            </div>
            <div className="cardBody">
              {ingredients.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {ingredients.map((ingredient, idx) => (
                    <li
                      key={idx}
                      style={{
                        marginBottom: '12px',
                        fontSize: '16px',
                        lineHeight: '1.6',
                      }}
                    >
                      {String(ingredient)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>
                  (not provided)
                </p>
              )}
            </div>
          </div>

          {/* Instructions Card */}
          <div className="card">
            <div className="cardHeader">
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#666',
                }}
              >
                Instructions
              </h2>
            </div>
            <div className="cardBody">
              {instructions.length > 0 ? (
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  {instructions.map((instruction, idx) => (
                    <li
                      key={idx}
                      style={{
                        marginBottom: '16px',
                        fontSize: '16px',
                        lineHeight: '1.6',
                      }}
                    >
                      {String(instruction)}
                    </li>
                  ))}
                </ol>
              ) : (
                <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>
                  (not provided)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Artifacts Section */}
        <div className="card">
          <div className="cardHeader">
            <button
              onClick={() => setShowJson(!showJson)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#666',
                }}
              >
                Artifacts
              </h2>
              <span
                style={{
                  fontSize: '20px',
                  color: '#666',
                  transform: showJson ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                ▼
              </span>
            </button>
          </div>
          {showJson && (
            <div className="cardBody">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <button onClick={handleCopyJson} className="button buttonSecondary">
                  {copySuccess === 'json' ? 'Copied ✓' : 'Copy Soustack JSON'}
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="button buttonSecondary"
                >
                  Download .soustack.json
                </button>
                {recipeData.is_owner && (
                  <button
                    onClick={handleCopyPrivateUrl}
                    className="button buttonSecondary"
                  >
                    {copySuccess === 'private' ? 'Copied ✓' : 'Copy private link'}
                  </button>
                )}
                {recipeData.is_public && recipeData.public_id && (
                  <button
                    onClick={handleCopyPublicUrl}
                    className="button buttonSecondary"
                  >
                    {copySuccess === 'public' ? 'Copied ✓' : 'Copy public link'}
                  </button>
                )}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '16px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {JSON.stringify(recipeData.doc.recipe, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

