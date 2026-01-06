'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadRecipe } from '@/lib/db/recipes';
import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';
import { createEmptyWorkbenchDoc } from '@/lib/mise/workbenchDoc';
import Workbench from '@/components/Workbench';

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [doc, setDoc] = useState<WorkbenchDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecipeDoc = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadRecipe(id);
      // Validate loaded doc structure
      if (
        loaded &&
        loaded.recipe &&
        loaded.draft &&
        loaded.meta &&
        typeof loaded.recipe.name === 'string'
      ) {
        setDoc(loaded);
      } else {
        // Malformed doc, fall back to empty
        console.warn('Loaded recipe doc is malformed, using empty doc');
        setDoc(createEmptyWorkbenchDoc());
      }
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        // Redirect to recipes list to sign in
        router.push('/recipes');
      } else {
        setError(err.message || 'Failed to load recipe');
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadRecipeDoc();
  }, [loadRecipeDoc]);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
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

  if (error) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '16px', color: '#dc2626' }}>
          Error: {error}
        </div>
        <button
          onClick={() => router.push('/recipes')}
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
          Back to Recipes
        </button>
      </div>
    );
  }

  // If doc is null (shouldn't happen after loading), use empty doc
  const initialDoc = doc || createEmptyWorkbenchDoc();

  return <Workbench initialDoc={initialDoc} />;
}

