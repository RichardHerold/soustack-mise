'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listMyRecipes } from '@/lib/db/recipes';
import AuthPanel from '@/components/AuthPanel';

type RecipeListItem = {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyRecipes();
      setRecipes(data || []);
      setAuthRequired(false);
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        setAuthRequired(true);
      } else {
        setError(err.message || 'Failed to load recipes');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <header
        style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link
              href="/"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#000',
                textDecoration: 'none',
              }}
            >
              Soustack Mise
            </Link>
            <Link
              href="/"
              style={{
                fontSize: '14px',
                color: '#666',
                textDecoration: 'none',
              }}
            >
              New Recipe
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <h1 style={{ margin: '0 0 24px 0', fontSize: '32px', fontWeight: 600 }}>
          My Recipes
        </h1>

        {authRequired && (
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          >
            <AuthPanel />
          </div>
        )}

        {loading && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
            Loading recipes...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            {error}
            <button
              onClick={loadRecipes}
              style={{
                marginLeft: '12px',
                padding: '4px 8px',
                border: '1px solid #dc2626',
                backgroundColor: 'transparent',
                color: '#dc2626',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !authRequired && (
          <>
            {recipes.length === 0 ? (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <p style={{ margin: '0 0 16px 0', color: '#666' }}>
                  No recipes saved yet.
                </p>
                <Link
                  href="/"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#000',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {recipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    style={{
                      display: 'block',
                      padding: '20px',
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  >
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        marginBottom: '8px',
                      }}
                    >
                      {recipe.title || 'Untitled Recipe'}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#666',
                      }}
                    >
                      Updated {formatDate(recipe.updated_at)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

