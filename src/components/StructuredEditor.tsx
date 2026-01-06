'use client';

import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';

type StructuredEditorProps = {
  recipe: SoustackLiteRecipe;
  onChange: (next: SoustackLiteRecipe) => void;
};

export default function StructuredEditor({
  recipe,
  onChange,
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

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...safeIngredients];
    newIngredients[index] = value;

    // Ensure we always have at least one item
    const filtered = newIngredients.filter((item) => item.trim().length > 0);
    const finalIngredients = filtered.length > 0 ? filtered : [''];

    const next = compileLiteRecipe({
      name: recipe.name,
      ingredients: finalIngredients,
      instructions: safeInstructions as string[],
      meta: recipe['x-mise']?.parse
        ? {
            confidence: recipe['x-mise'].parse.confidence,
            mode: recipe['x-mise'].parse.mode,
          }
        : undefined,
    });

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

    if (recipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: recipe['x-mise'].prose,
      };
    }

    onChange(next);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...safeInstructions];
    newInstructions[index] = value;

    // Ensure we always have at least one item
    const filtered = newInstructions.filter((item) => item.trim().length > 0);
    const finalInstructions = filtered.length > 0 ? filtered : [''];

    const next = compileLiteRecipe({
      name: recipe.name,
      ingredients: safeIngredients as string[],
      instructions: finalInstructions,
      meta: recipe['x-mise']?.parse
        ? {
            confidence: recipe['x-mise'].parse.confidence,
            mode: recipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    if (recipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: recipe['x-mise'].prose,
      };
    }

    onChange(next);
  };

  const handleAddInstruction = () => {
    const newInstructions = [...safeInstructions, ''];
    const next = compileLiteRecipe({
      name: recipe.name,
      ingredients: safeIngredients as string[],
      instructions: newInstructions,
      meta: recipe['x-mise']?.parse
        ? {
            confidence: recipe['x-mise'].parse.confidence,
            mode: recipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    if (recipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: recipe['x-mise'].prose,
      };
    }

    onChange(next);
  };

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = safeInstructions.filter((_, i) => i !== index);
    // Ensure we always have at least one item
    const finalInstructions = newInstructions.length > 0 ? newInstructions : [''];

    const next = compileLiteRecipe({
      name: recipe.name,
      ingredients: safeIngredients as string[],
      instructions: finalInstructions,
      meta: recipe['x-mise']?.parse
        ? {
            confidence: recipe['x-mise'].parse.confidence,
            mode: recipe['x-mise'].parse.mode,
          }
        : undefined,
    });

    if (recipe['x-mise']?.prose) {
      next['x-mise'] = {
        ...next['x-mise'],
        prose: recipe['x-mise'].prose,
      };
    }

    onChange(next);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
          Structured Editor
        </h2>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
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

        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Ingredients
            </label>
            <button
              onClick={handleAddIngredient}
              style={{
                padding: '6px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              + Add ingredient
            </button>
          </div>
          {safeIngredients.map((ingredient, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <input
                type="text"
                value={ingredient}
                onChange={(e) => handleIngredientChange(idx, e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={() => handleRemoveIngredient(idx)}
                disabled={safeIngredients.length === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: safeIngredients.length === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  opacity: safeIngredients.length === 1 ? 0.5 : 1,
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Instructions
            </label>
            <button
              onClick={handleAddInstruction}
              style={{
                padding: '6px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              + Add step
            </button>
          </div>
          {safeInstructions.map((instruction, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <textarea
                value={instruction}
                onChange={(e) => handleInstructionChange(idx, e.target.value)}
                rows={2}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={() => handleRemoveInstruction(idx)}
                disabled={safeInstructions.length === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: safeInstructions.length === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  opacity: safeInstructions.length === 1 ? 0.5 : 1,
                  alignSelf: 'flex-start',
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

