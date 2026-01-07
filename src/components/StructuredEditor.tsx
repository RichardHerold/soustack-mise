'use client';

import type { SoustackLiteRecipe, SoustackProfile } from '@/lib/mise/types';
import { VALID_SOUSTACK_PROFILES } from '@/lib/mise/types';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import MiseEnPlaceSection from './MiseEnPlaceSection';
import IngredientsSection from './IngredientsSection';
import CapabilitiesPanel from './CapabilitiesPanel';
import AfterCookingSection from './AfterCookingSection';
import InstructionsSection from './InstructionsSection';
import MiseCheckPanel from './MiseCheckPanel';

type StructuredEditorProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
  miseMode?: 'draft' | 'mise';
};

export default function StructuredEditor({
  recipe,
  onChange,
  miseMode = 'draft',
}: StructuredEditorProps) {
  const ingredients = Array.isArray(recipe.ingredients)
    ? (recipe.ingredients as string[])
    : [];
  const instructions = Array.isArray(recipe.instructions)
    ? (recipe.instructions as string[])
    : [];

  // Ensure we always have at least one item in each array
  const safeIngredients = ingredients.length > 0 ? ingredients : [''];
  const safeInstructions = instructions.length > 0 ? instructions : [''];

  const handleNameChange = (name: string) => {
    const next = {
      ...recipe,
      name: name.trim() || 'Untitled Recipe',
    };
    onChange(next);
  };

  const handleStackToggle = (stackName: string, enabled: boolean) => {
    const currentStacks = { ...recipe.stacks };
    // Stack keys include "@1" suffix to match component checks
    const stackKey = `${stackName}@1`;
    
    if (enabled) {
      // Add stack with version 1
      currentStacks[stackKey] = 1;
    } else {
      // Remove stack declaration only
      delete currentStacks[stackKey];
    }

    const next = {
      ...recipe,
      stacks: currentStacks,
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
      name: recipe.name,
      description: recipe.description,
      ingredients: finalIngredients,
      instructions: safeInstructions as string[],
      meta: recipe['x-mise']?.parse
        ? {
            confidence: recipe['x-mise'].parse.confidence,
            mode: recipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    // Preserve profile and stacks
    next.profile = recipe.profile;
    next.stacks = { ...recipe.stacks };

    // Preserve x-mise prose if it exists
    if (recipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: recipe['x-mise'].prose,
      };
    }

    onChange(next);
  };

  const handleAddIngredient = () => {
    const newIngredients = [...safeIngredients, ''];
    const next = compileLiteRecipe({
      name: recipe.name,
      ingredients: newIngredients as string[],
      instructions: safeInstructions as string[],
      meta: recipe['x-mise']?.parse
        ? {
            confidence: recipe['x-mise'].parse.confidence,
            mode: recipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    // Preserve stacks
    next.stacks = { ...recipe.stacks };

    if (recipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: recipe['x-mise'].prose,
      };
    }

    onChange(next);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = safeIngredients.filter((_, i) => i !== index);
    // Ensure we always have at least one item
    const finalIngredients = newIngredients.length > 0 ? newIngredients : [''];

    const next = compileLiteRecipe({
      name: recipe.name,
      ingredients: finalIngredients as string[],
      instructions: safeInstructions as string[],
      meta: recipe['x-mise']?.parse
        ? {
            confidence: recipe['x-mise'].parse.confidence,
            mode: recipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    // Preserve stacks
    next.stacks = { ...recipe.stacks };

    if (recipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: recipe['x-mise'].prose,
      };
    }

    onChange(next);
  };


  const handleProfileChange = (profile: SoustackProfile) => {
    // Changing profile does NOT auto-add or remove stacks
    // Profile selection is explicit author intent
    const next: SoustackLiteRecipe = {
      ...recipe,
      profile,
      // Preserve existing stacks - do not mutate
      stacks: recipe.stacks || {},
    };
    onChange(next);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
          Structured Editor
        </h2>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar with profile selection */}
        <div
          style={{
            width: '240px',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#f9fafb',
            padding: '16px',
            overflow: 'auto',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Soustack Profile
            </label>
            <select
              value={recipe.profile}
              onChange={(e) => handleProfileChange(e.target.value as SoustackProfile)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {VALID_SOUSTACK_PROFILES.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#999',
                fontStyle: 'italic',
              }}
            >
              Profile selection does not auto-modify content
            </div>
          </div>
          <CapabilitiesPanel recipe={recipe} onChange={onChange} />
        </div>
        {/* Main editor content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {/* Mise Check Panel - only visible in Mise mode */}
        {miseMode === 'mise' && <MiseCheckPanel recipe={recipe} />}
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
            value={recipe.name}
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

        {/* Ingredients section */}
        <IngredientsSection recipe={recipe} onChange={onChange} />

        {/* Instructions section */}
        <InstructionsSection recipe={recipe} onChange={onChange} />

        {/* Mise en Place section */}
        <MiseEnPlaceSection recipe={recipe} onChange={onChange} />

        {/* After Cooking section */}
        <AfterCookingSection recipe={recipe} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

