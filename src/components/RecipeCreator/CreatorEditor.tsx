'use client';

import { useState } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import IngredientCard from './IngredientCard';
import InstructionCard from './InstructionCard';

type CreatorEditorProps = {
  recipe: SoustackLiteRecipe;
  onChange: (recipe: SoustackLiteRecipe) => void;
  onStart?: () => void;
};

export default function CreatorEditor({ recipe, onChange, onStart }: CreatorEditorProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    const next = new Set(expandedCards);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedCards(next);
  };

  // Handle metadata changes
  const handleNameChange = (name: string) => {
    onChange({ ...recipe, name: name || 'Untitled Recipe' });
  };

  const handleDescriptionChange = (description: string) => {
    onChange({ ...recipe, description: description || undefined });
  };

  // Handle ingredients
  const handleIngredientChange = (index: number, value: unknown) => {
    const ingredients = [...(Array.isArray(recipe.ingredients) ? recipe.ingredients : [])];
    ingredients[index] = value;
    onChange({ ...recipe, ingredients: ingredients.length > 0 ? ingredients : ['(not provided)'] });
  };

  const handleAddIngredient = () => {
    const ingredients = [...(Array.isArray(recipe.ingredients) ? recipe.ingredients : [])];
    ingredients.push('');
    onChange({ ...recipe, ingredients });
  };

  const handleRemoveIngredient = (index: number) => {
    const ingredients = [...(Array.isArray(recipe.ingredients) ? recipe.ingredients : [])];
    ingredients.splice(index, 1);
    onChange({ ...recipe, ingredients: ingredients.length > 0 ? ingredients : ['(not provided)'] });
  };

  // Handle instructions
  const handleInstructionChange = (index: number, value: unknown) => {
    const instructions = [...(Array.isArray(recipe.instructions) ? recipe.instructions : [])];
    instructions[index] = value;
    onChange({ ...recipe, instructions: instructions.length > 0 ? instructions : ['(not provided)'] });
  };

  const handleAddInstruction = () => {
    const instructions = [...(Array.isArray(recipe.instructions) ? recipe.instructions : [])];
    instructions.push('');
    onChange({ ...recipe, instructions });
  };

  const handleRemoveInstruction = (index: number) => {
    const instructions = [...(Array.isArray(recipe.instructions) ? recipe.instructions : [])];
    instructions.splice(index, 1);
    onChange({ ...recipe, instructions: instructions.length > 0 ? instructions : ['(not provided)'] });
  };

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.filter((item) => {
        const str = typeof item === 'string' ? item : String(item);
        return str !== '(not provided)' && str.trim() !== '';
      })
    : [];

  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions.filter((item) => {
        let str: string;
        if (typeof item === 'string') {
          str = item;
        } else if (typeof item === 'object' && item !== null && 'text' in item) {
          str = String((item as { text: unknown }).text);
        } else {
          str = String(item);
        }
        return str !== '(not provided)' && str.trim() !== '';
      })
    : [];

  // Show start prompt if in build mode and no content
  if (onStart && ingredients.length === 0 && instructions.length === 0 && !recipe.name) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>
          Start building your recipe
        </div>
        <button
          onClick={onStart}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#000',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Recipe Name */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Recipe Name</div>
        <div style={{ height: '1px', backgroundColor: '#e0e0e0', marginBottom: '12px' }} />
        <input
          type="text"
          value={recipe.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Grandma's Chocolate Chip Cookies"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            fontSize: '16px',
            outline: 'none',
          }}
        />
      </div>

      {/* Description */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
          Description (optional)
        </div>
        <div style={{ height: '1px', backgroundColor: '#e0e0e0', marginBottom: '12px' }} />
        <textarea
          value={recipe.description || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="The best cookies you'll ever make, passed down through generations"
          rows={2}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>

      {/* Ingredients Section */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 500 }}>INGREDIENTS</div>
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
            + Add
          </button>
        </div>
        <div style={{ height: '1px', backgroundColor: '#e0e0e0', marginBottom: '16px' }} />

        {ingredients.length === 0 ? (
          <div
            style={{
              padding: '24px',
              border: '1px dashed #d0d0d0',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#999',
            }}
          >
            <button
              onClick={handleAddIngredient}
              style={{
                padding: '8px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Add first ingredient
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ingredients.map((ingredient, idx) => (
              <IngredientCard
                key={idx}
                id={`ingredient-${idx}`}
                ingredient={ingredient}
                isExpanded={expandedCards.has(`ingredient-${idx}`)}
                onToggleExpand={() => toggleCard(`ingredient-${idx}`)}
                onChange={(value) => handleIngredientChange(idx, value)}
                onRemove={() => handleRemoveIngredient(idx)}
              />
            ))}
            <button
              onClick={handleAddIngredient}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                border: '1px dashed #d0d0d0',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#666',
              }}
            >
              + Add ingredient
            </button>
          </div>
        )}
      </div>

      {/* Instructions Section */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 500 }}>INSTRUCTIONS</div>
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
            + Add
          </button>
        </div>
        <div style={{ height: '1px', backgroundColor: '#e0e0e0', marginBottom: '16px' }} />

        {instructions.length === 0 ? (
          <div
            style={{
              padding: '24px',
              border: '1px dashed #d0d0d0',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#999',
            }}
          >
            <button
              onClick={handleAddInstruction}
              style={{
                padding: '8px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Add first step
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {instructions.map((instruction, idx) => (
              <InstructionCard
                key={idx}
                id={`instruction-${idx}`}
                index={idx}
                instruction={instruction}
                isExpanded={expandedCards.has(`instruction-${idx}`)}
                onToggleExpand={() => toggleCard(`instruction-${idx}`)}
                onChange={(value) => handleInstructionChange(idx, value)}
                onRemove={() => handleRemoveInstruction(idx)}
              />
            ))}
            <button
              onClick={handleAddInstruction}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                border: '1px dashed #d0d0d0',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#666',
              }}
            >
              + Add step
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
