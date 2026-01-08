import type { SoustackLiteRecipe } from '@/lib/mise/types';

/**
 * Implicitly computes capabilities from recipe content.
 * Enables stacks based on what data exists, not user toggles.
 */
export function computeCapabilities(recipe: SoustackLiteRecipe): Record<string, number> {
  const caps: Record<string, number> = {};

  // Check for structured ingredients
  if (Array.isArray(recipe.ingredients)) {
    const hasStructured = recipe.ingredients.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        ('quantity' in item || 'unit' in item || ('name' in item && typeof item.name === 'string'))
    );
    if (hasStructured) {
      caps.structured = 1;
    }

    // Check for scaling data
    const hasScaling = recipe.ingredients.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'scaling' in item &&
        item.scaling !== undefined
    );
    if (hasScaling) {
      caps.scaling = 1;
    }
  }

  // Check for timing data in instructions
  if (Array.isArray(recipe.instructions)) {
    const hasTiming = recipe.instructions.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'timing' in item &&
        item.timing !== undefined
    );
    if (hasTiming) {
      caps.timed = 1;
    }

    // Check for structured instructions
    const hasStructuredInstructions = recipe.instructions.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'text' in item &&
        typeof item.text === 'string'
    );
    if (hasStructuredInstructions) {
      caps.structured = 1;
    }

    // Check for input references
    const hasReferenced = recipe.instructions.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'inputs' in item &&
        Array.isArray(item.inputs) &&
        item.inputs.length > 0
    );
    if (hasReferenced) {
      caps.referenced = 1;
    }
  }

  // Check for mise en place
  const recipeWithMise = recipe as SoustackLiteRecipe & {
    miseEnPlace?: unknown[];
  };
  if (recipeWithMise.miseEnPlace && Array.isArray(recipeWithMise.miseEnPlace) && recipeWithMise.miseEnPlace.length > 0) {
    caps.prep = 1;
  }

  // Check for storage data
  const recipeWithStorage = recipe as SoustackLiteRecipe & {
    storage?: unknown;
  };
  if (recipeWithStorage.storage && typeof recipeWithStorage.storage === 'object' && recipeWithStorage.storage !== null) {
    caps.storage = 1;
  }

  return caps;
}
