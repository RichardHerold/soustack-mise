import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { isStackEnabled } from '@/lib/mise/stacks';

/**
 * Detects if instructions contain obvious time patterns
 * Examples: "10 minutes", "bake 30 min", "until golden", "for 5-10 minutes"
 */
export function detectTimePatterns(recipe: SoustackLiteRecipe): boolean {
  if (!Array.isArray(recipe.instructions)) return false;

  const timePatterns = [
    /\d+\s*(min|minute|minutes|hr|hour|hours)/i,
    /\d+-\d+\s*(min|minute|minutes)/i,
    /for\s+\d+/i,
    /until\s+(golden|brown|tender|done|cooked)/i,
    /bake\s+\d+/i,
    /cook\s+\d+/i,
    /simmer\s+\d+/i,
  ];

  for (const instruction of recipe.instructions) {
    let text = '';
    if (typeof instruction === 'string') {
      text = instruction;
    } else if (typeof instruction === 'object' && instruction !== null && 'text' in instruction) {
      text = String(instruction.text || '');
    } else {
      text = String(instruction);
    }

    for (const pattern of timePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if recipe has storage data
 */
export function hasStorageData(recipe: SoustackLiteRecipe): boolean {
  const recipeWithStorage = recipe as SoustackLiteRecipe & {
    storage?: unknown;
  };
  return (
    recipeWithStorage.storage !== undefined &&
    recipeWithStorage.storage !== null &&
    typeof recipeWithStorage.storage === 'object'
  );
}

/**
 * Checks if recipe has miseEnPlace items
 */
export function hasMiseEnPlaceData(recipe: SoustackLiteRecipe): boolean {
  const recipeWithMiseEnPlace = recipe as SoustackLiteRecipe & {
    miseEnPlace?: Array<{ text: string }>;
  };
  return (
    Array.isArray(recipeWithMiseEnPlace.miseEnPlace) &&
    recipeWithMiseEnPlace.miseEnPlace.length > 0
  );
}

/**
 * Checks if timed stack should be suggested
 */
export function shouldSuggestTimed(recipe: SoustackLiteRecipe): boolean {
  return (
    detectTimePatterns(recipe) &&
    !isStackEnabled(recipe.stacks, 'timed')
  );
}

/**
 * Checks if storage stack should be auto-enabled
 */
export function shouldAutoEnableStorage(recipe: SoustackLiteRecipe): boolean {
  return (
    hasStorageData(recipe) &&
    !isStackEnabled(recipe.stacks, 'storage')
  );
}

/**
 * Checks if prep stack should be auto-enabled
 */
export function shouldAutoEnablePrep(recipe: SoustackLiteRecipe): boolean {
  return (
    hasMiseEnPlaceData(recipe) &&
    !isStackEnabled(recipe.stacks, 'prep')
  );
}
