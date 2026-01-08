'use client';

import { useEffect, useRef } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import { migrateVersionedStackKeys } from '@/lib/mise/stacks';
import MiseEnPlaceSection from './MiseEnPlaceSection';
import IngredientsSection from './IngredientsSection';
import AfterCookingSection from './AfterCookingSection';
import InstructionsSection from './InstructionsSection';
import MiseCheckPanel from './MiseCheckPanel';
import MiseGuidanceRail from './MiseGuidanceRail';

type StructuredEditorProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
  miseMode?: 'draft' | 'mise';
  hideHeader?: boolean; // Hide header and name input (for Creator flow)
};

export default function StructuredEditor({
  recipe,
  onChange,
  miseMode = 'draft',
  hideHeader = false,
}: StructuredEditorProps) {
  // Normalize recipe at the edge: migrate versioned stack keys and prep data
  const normalizedRecipeRef = useRef<SoustackLiteRecipe | null>(null);

  useEffect(() => {
    let normalized = { ...recipe };
    let hasChanges = false;

    // Check for prep data migration BEFORE migrating stack keys
    const recipeWithMiseEnPlace = normalized as SoustackLiteRecipe & {
      miseEnPlace?: Array<{ text: string }>;
    };
    const currentMiseEnPlace = recipeWithMiseEnPlace.miseEnPlace;
    
    // Migrate prep data from stacks['prep@1'] to recipe.miseEnPlace (only if not already migrated)
    if (!currentMiseEnPlace && 'prep@1' in recipe.stacks && recipe.stacks['prep@1'] !== undefined) {
      const prepData = recipe.stacks['prep@1'];
      if (Array.isArray(prepData)) {
        const miseEnPlaceItems = prepData.filter(
          (item): item is { text: string } =>
            typeof item === 'object' &&
            item !== null &&
            'text' in item &&
            typeof item.text === 'string'
        );
        if (miseEnPlaceItems.length > 0) {
          recipeWithMiseEnPlace.miseEnPlace = miseEnPlaceItems;
          hasChanges = true;
        }
      }
    }

    // Migrate versioned stack keys to unversioned format
    const normalizedStacks = migrateVersionedStackKeys(normalized.stacks);
    if (normalizedStacks !== normalized.stacks) {
      normalized.stacks = normalizedStacks;
      hasChanges = true;
    }

    if (hasChanges) {
      normalizedRecipeRef.current = normalized;
      onChange(normalized);
    } else {
      normalizedRecipeRef.current = recipe;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe]);

  // Use normalized recipe if available, otherwise use original
  const currentRecipe =
    normalizedRecipeRef.current || recipe;

  const ingredients = Array.isArray(currentRecipe.ingredients)
    ? (currentRecipe.ingredients as string[])
    : [];

  // Ensure we always have at least one item in each array
  const safeIngredients = ingredients.length > 0 ? ingredients : [''];

  const handleNameChange = (name: string) => {
    const next = {
      ...currentRecipe,
      name: name.trim() || 'Untitled Recipe',
    };
    onChange(next);
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...safeIngredients];
    newIngredients[index] = value;

    // Ensure we always have at least one item
    const filtered = newIngredients.filter((item) => item.trim().length > 0);
    const finalIngredients = filtered.length > 0 ? filtered : [''];

    const next = compileLiteRecipe({
      name: currentRecipe.name,
      description: currentRecipe.description,
      ingredients: finalIngredients,
      instructions: currentRecipe.instructions as string[],
      meta: currentRecipe['x-mise']?.parse
        ? {
            confidence: currentRecipe['x-mise'].parse.confidence,
            mode: currentRecipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    // Preserve profile and stacks
    next.profile = currentRecipe.profile;
    next.stacks = { ...currentRecipe.stacks };

    // Preserve x-mise prose if it exists
    if (currentRecipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: currentRecipe['x-mise'].prose,
      };
    }

    // Preserve miseEnPlace if it exists
    const recipeWithMiseEnPlace = currentRecipe as SoustackLiteRecipe & {
      miseEnPlace?: Array<{ text: string }>;
    };
    if (recipeWithMiseEnPlace.miseEnPlace) {
      (next as SoustackLiteRecipe & {
        miseEnPlace?: Array<{ text: string }>;
      }).miseEnPlace = recipeWithMiseEnPlace.miseEnPlace;
    }

    onChange(next);
  };

  const handleAddIngredient = () => {
    const newIngredients = [...safeIngredients, ''];
    const next = compileLiteRecipe({
      name: currentRecipe.name,
      ingredients: newIngredients as string[],
      instructions: currentRecipe.instructions as string[],
      meta: currentRecipe['x-mise']?.parse
        ? {
            confidence: currentRecipe['x-mise'].parse.confidence,
            mode: currentRecipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    // Preserve stacks
    next.stacks = { ...currentRecipe.stacks };

    if (currentRecipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: currentRecipe['x-mise'].prose,
      };
    }

    // Preserve miseEnPlace if it exists
    const recipeWithMiseEnPlace = currentRecipe as SoustackLiteRecipe & {
      miseEnPlace?: Array<{ text: string }>;
    };
    if (recipeWithMiseEnPlace.miseEnPlace) {
      (next as SoustackLiteRecipe & {
        miseEnPlace?: Array<{ text: string }>;
      }).miseEnPlace = recipeWithMiseEnPlace.miseEnPlace;
    }

    onChange(next);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = safeIngredients.filter((_, i) => i !== index);
    // Ensure we always have at least one item
    const finalIngredients = newIngredients.length > 0 ? newIngredients : [''];

    const next = compileLiteRecipe({
      name: currentRecipe.name,
      ingredients: finalIngredients as string[],
      instructions: currentRecipe.instructions as string[],
      meta: currentRecipe['x-mise']?.parse
        ? {
            confidence: currentRecipe['x-mise'].parse.confidence,
            mode: currentRecipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    // Preserve stacks
    next.stacks = { ...currentRecipe.stacks };

    if (currentRecipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: currentRecipe['x-mise'].prose,
      };
    }

    // Preserve miseEnPlace if it exists
    const recipeWithMiseEnPlace = currentRecipe as SoustackLiteRecipe & {
      miseEnPlace?: Array<{ text: string }>;
    };
    if (recipeWithMiseEnPlace.miseEnPlace) {
      (next as SoustackLiteRecipe & {
        miseEnPlace?: Array<{ text: string }>;
      }).miseEnPlace = recipeWithMiseEnPlace.miseEnPlace;
    }

    onChange(next);
  };


  const isMiseMode = miseMode === 'mise';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!hideHeader && (
        <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
            {isMiseMode ? 'Mise en Place' : 'Structured Editor'}
          </h2>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main editor content - expands to full width when rail is not present */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Mise Check Panel - only visible in Mise mode, shown as progress bar */}
          {isMiseMode && <MiseCheckPanel recipe={currentRecipe} />}
          {!hideHeader && (
            <div style={{ marginBottom: '32px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Recipe Name
              </label>
              <input
                type="text"
                value={currentRecipe.name}
                onChange={(e) => handleNameChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>
          )}

          {/* Ingredients section */}
          <IngredientsSection recipe={currentRecipe} onChange={onChange} />

          {/* Mise en Place section */}
          <MiseEnPlaceSection recipe={currentRecipe} onChange={onChange} />

          {/* Instructions section */}
          <InstructionsSection recipe={currentRecipe} onChange={onChange} />

          {/* After Cooking section */}
          <AfterCookingSection recipe={currentRecipe} onChange={onChange} />
        </div>

        {/* Mise Guidance Rail - only visible in Mise mode when checks exist */}
        {/* Returns null when checks.length === 0, allowing main editor to expand to full width */}
        {isMiseMode && (
          <MiseGuidanceRail recipe={currentRecipe} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

