import type { SoustackLiteRecipe } from './types';

const CANONICAL_SCHEMA_URL = 'https://soustack.spec/soustack.schema.json';

/**
 * Compiles parse results into an always-valid Soustack Lite recipe.
 * Never throws; always returns a valid object with required fields.
 */
export function compileLiteRecipe(input: {
  name?: string | null;
  description?: string | null;
  ingredients?: string[] | null;
  instructions?: string[] | null;
  meta?: { confidence?: number; mode?: string };
}): SoustackLiteRecipe {
  const name = input.name?.trim() || 'Untitled Recipe';
  const description = input.description?.trim() || undefined;
  const ingredients = input.ingredients?.filter((item) => item.trim().length > 0) || [];
  const instructions = input.instructions?.filter((item) => item.trim().length > 0) || [];

  const recipe: SoustackLiteRecipe = {
    $schema: CANONICAL_SCHEMA_URL,
    profile: 'lite',
    stacks: {},
    name,
    ...(description && { description }),
    ingredients: ingredients.length > 0 ? ingredients : ['(not provided)'],
    instructions: instructions.length > 0 ? instructions : ['(not provided)'],
  };

  // Include x-mise metadata only if meta is provided
  if (input.meta) {
    recipe['x-mise'] = {
      parse: {
        confidence: input.meta.confidence ?? 0.0,
        mode: input.meta.mode ?? 'unknown',
      },
    };
  }

  return recipe;
}

