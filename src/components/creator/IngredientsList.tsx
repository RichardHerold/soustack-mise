'use client';

import { useState } from 'react';
import IngredientCard, { type IngredientObject } from './IngredientCard';

type IngredientsListProps = {
  ingredients: (string | IngredientObject)[];
  onChange: (updated: (string | IngredientObject)[]) => void;
};

export default function IngredientsList({ ingredients, onChange }: IngredientsListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleChange = (index: number, updated: string | IngredientObject) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = updated;
    onChange(newIngredients);
  };

  const handleRemove = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onChange(newIngredients);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleAdd = () => {
    const newIngredients = [...ingredients, { name: '' }];
    onChange(newIngredients);
    setExpandedIndex(newIngredients.length - 1);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newIngredients = [...ingredients];
    [newIngredients[index - 1], newIngredients[index]] = [
      newIngredients[index],
      newIngredients[index - 1],
    ];
    onChange(newIngredients);
    setExpandedIndex(index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index === ingredients.length - 1) return;
    const newIngredients = [...ingredients];
    [newIngredients[index], newIngredients[index + 1]] = [
      newIngredients[index + 1],
      newIngredients[index],
    ];
    onChange(newIngredients);
    setExpandedIndex(index + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ margin: 0 }}>INGREDIENTS</h3>
      </div>
      {ingredients.map((ingredient, index) => (
        <IngredientCard
          key={index}
          ingredient={ingredient}
          index={index}
          isExpanded={expandedIndex === index}
          onToggleExpand={() => handleToggleExpand(index)}
          onChange={(updated) => handleChange(index, updated)}
          onRemove={() => handleRemove(index)}
          onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
          onMoveDown={index < ingredients.length - 1 ? () => handleMoveDown(index) : undefined}
        />
      ))}
      <button
        onClick={handleAdd}
        className="btn btn-secondary"
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        + Add ingredient
      </button>
    </div>
  );
}
