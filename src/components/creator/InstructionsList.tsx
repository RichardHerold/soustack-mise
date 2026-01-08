'use client';

import { useState } from 'react';
import InstructionCard, { type InstructionObject } from './InstructionCard';

type InstructionsListProps = {
  instructions: (string | InstructionObject)[];
  onChange: (updated: (string | InstructionObject)[]) => void;
};

export default function InstructionsList({ instructions, onChange }: InstructionsListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleChange = (index: number, updated: string | InstructionObject) => {
    const newInstructions = [...instructions];
    newInstructions[index] = updated;
    onChange(newInstructions);
  };

  const handleRemove = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    onChange(newInstructions);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleAdd = () => {
    const newInstructions = [...instructions, { text: '' }];
    onChange(newInstructions);
    setExpandedIndex(newInstructions.length - 1);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newInstructions = [...instructions];
    [newInstructions[index - 1], newInstructions[index]] = [
      newInstructions[index],
      newInstructions[index - 1],
    ];
    onChange(newInstructions);
    setExpandedIndex(index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index === instructions.length - 1) return;
    const newInstructions = [...instructions];
    [newInstructions[index], newInstructions[index + 1]] = [
      newInstructions[index + 1],
      newInstructions[index],
    ];
    onChange(newInstructions);
    setExpandedIndex(index + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ margin: 0 }}>INSTRUCTIONS</h3>
      </div>
      {instructions.map((instruction, index) => (
        <InstructionCard
          key={index}
          instruction={instruction}
          index={index}
          isExpanded={expandedIndex === index}
          onToggleExpand={() => handleToggleExpand(index)}
          onChange={(updated) => handleChange(index, updated)}
          onRemove={() => handleRemove(index)}
          onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
          onMoveDown={index < instructions.length - 1 ? () => handleMoveDown(index) : undefined}
        />
      ))}
      <button
        onClick={handleAdd}
        className="btn btn-secondary"
        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
      >
        + Add step
      </button>
    </div>
  );
}
