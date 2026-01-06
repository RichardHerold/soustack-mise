'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadRecipeWithMeta } from '@/lib/db/recipes';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type RecipeCardProps = {
  id: string;
  title: string;
  updated_at: string;
  is_public?: boolean;
  public_id?: string | null;
};

export default function RecipeCard({
  id,
  title,
  updated_at,
  is_public = false,
  public_id = null,
}: RecipeCardProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<SoustackLiteRecipe | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRecipe = useCallback(async () => {
    try {
      const { doc } = await loadRecipeWithMeta(id);
      setRecipe(doc.recipe);
    } catch (error) {
      console.error('Failed to load recipe:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const handleCardClick = () => {
    router.push(`/r/${id}`);
  };

  // Extract description from prose or first instruction
  const getDescription = (): string => {
    if (recipe?.['x-mise']?.prose?.text) {
      const prose = recipe['x-mise'].prose.text;
      // Take first 2 sentences or ~150 characters
      const sentences = prose.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length >= 2) {
        return (sentences[0] + '. ' + sentences[1] + '.').substring(0, 150);
      }
      return prose.substring(0, 150) + (prose.length > 150 ? '...' : '');
    }
    if (recipe?.instructions && recipe.instructions.length > 0) {
      const firstInstruction = String(recipe.instructions[0]);
      return firstInstruction.substring(0, 150) + (firstInstruction.length > 150 ? '...' : '');
    }
    return 'No description available.';
  };

  // Extract tags from ingredients (common ingredients that could be tags)
  const getTags = (): string[] => {
    if (!recipe?.ingredients) return [];
    const commonTags = ['dill', 'feta', 'chicken', 'spinach', 'lemon', 'garlic', 'onion', 'tomato', 'basil', 'parsley'];
    const ingredientText = recipe.ingredients.map(i => String(i).toLowerCase()).join(' ');
    const foundTags = commonTags.filter(tag => ingredientText.includes(tag));
    return foundTags.slice(0, 5); // Limit to 5 tags
  };

  // Estimate prep time from instructions (rough heuristic)
  const getPrepTime = (): string => {
    if (!recipe?.instructions) return 'N/A';
    const instructionCount = recipe.instructions.length;
    // Rough estimate: 5 minutes per instruction step, minimum 15 minutes
    const estimatedMinutes = Math.max(15, instructionCount * 5);
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes}m`;
    }
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const ingredients = recipe?.ingredients ? Array.isArray(recipe.ingredients) ? recipe.ingredients : [] : [];
  const ingredientCount = ingredients.length;
  const description = loading ? 'Loading...' : getDescription();
  const tags = getTags();
  const prepTime = getPrepTime();

  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={handleCardClick}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 700,
            margin: 0,
            color: '#000',
            flex: 1,
            lineHeight: '1.3',
          }}
        >
          {title || 'Untitled Recipe'}
        </h2>
        <div
          style={{
            fontSize: '18px',
            color: '#ccc',
            marginLeft: '8px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement favorite functionality
          }}
        >
          ☆
        </div>
      </div>

      <p
        style={{
          fontSize: '13px',
          color: '#666',
          lineHeight: '1.4',
          margin: '0 0 12px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: '1 0 auto',
        }}
      >
        {description}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          fontSize: '13px',
          color: '#666',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px' }}>🕐</span>
          <span>{prepTime}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px' }}>🥕</span>
          <span>{ingredientCount} {ingredientCount === 1 ? 'ingredient' : 'ingredients'}</span>
        </div>
      </div>

      {tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '12px',
          }}
        >
          {tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="chip chipMuted"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
              }}
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span
              className="chip chipMuted"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
              }}
            >
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid #f0f0f0',
          marginTop: 'auto',
        }}
      >
        <Link
          href={`/recipes/${id}`}
          className="button buttonPrimary"
          onClick={(e) => e.stopPropagation()}
          style={{ textDecoration: 'none', fontSize: '12px', padding: '6px 12px' }}
        >
          Edit in Mise
        </Link>
      </div>
    </div>
  );
}



