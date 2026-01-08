'use client';

import { useState } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type PreviewPaneProps = {
  recipe: SoustackLiteRecipe;
  mode: 'rendered' | 'json';
};

export default function PreviewPane({ recipe, mode }: PreviewPaneProps) {
  const [activeTab, setActiveTab] = useState<'rendered' | 'json'>(mode);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
        <button
          onClick={() => setActiveTab('rendered')}
          style={{
            flex: 1,
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'rendered' ? '2px solid #000' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'rendered' ? 600 : 400,
            color: activeTab === 'rendered' ? '#000' : '#666',
          }}
        >
          Rendered
        </button>
        <button
          onClick={() => setActiveTab('json')}
          style={{
            flex: 1,
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'json' ? '2px solid #000' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'json' ? 600 : 400,
            color: activeTab === 'json' ? '#000' : '#666',
          }}
        >
          JSON
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {activeTab === 'rendered' && <RenderedPreview recipe={recipe} />}
        {activeTab === 'json' && <JsonPreview recipe={recipe} />}
      </div>
    </div>
  );
}

function RenderedPreview({ recipe }: { recipe: SoustackLiteRecipe }) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <div>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600 }}>{recipe.name}</h2>
      {recipe.description && (
        <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#666', lineHeight: '1.6' }}>
          {recipe.description}
        </p>
      )}

      <section style={{ marginBottom: '32px' }}>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#666',
          }}
        >
          Ingredients
        </h3>
        {ingredients.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>No ingredients provided</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '24px', listStyle: 'none' }}>
            {ingredients.map((ingredient, idx) => {
              if (typeof ingredient === 'string') {
                const str = ingredient.trim();
                if (str === '(not provided)' || str === '') return null;
                return (
                  <li key={idx} style={{ marginBottom: '8px', fontSize: '16px', lineHeight: '1.6' }}>
                    {str}
                  </li>
                );
              }
              if (typeof ingredient === 'object' && ingredient !== null) {
                if ('section' in ingredient) {
                  const section = ingredient as { section: { name: string; items: unknown[] } };
                  return (
                    <li key={idx} style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                        {section.section.name || 'Untitled Section'}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '24px', listStyle: 'none' }}>
                        {section.section.items.map((item, itemIdx) => {
                          if (typeof item === 'string') {
                            return (
                              <li key={itemIdx} style={{ marginBottom: '8px', fontSize: '16px', lineHeight: '1.6' }}>
                                {item}
                              </li>
                            );
                          }
                          if (typeof item === 'object' && item !== null && 'name' in item) {
                            const obj = item as { quantity?: string | number; unit?: string; name: string };
                            const parts: string[] = [];
                            if (obj.quantity) parts.push(String(obj.quantity));
                            if (obj.unit) parts.push(obj.unit);
                            parts.push(obj.name);
                            return (
                              <li key={itemIdx} style={{ marginBottom: '8px', fontSize: '16px', lineHeight: '1.6' }}>
                                {parts.join(' ')}
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ul>
                    </li>
                  );
                }
                if ('name' in ingredient) {
                  const obj = ingredient as { quantity?: string | number; unit?: string; name: string };
                  const parts: string[] = [];
                  if (obj.quantity) parts.push(String(obj.quantity));
                  if (obj.unit) parts.push(obj.unit);
                  parts.push(obj.name);
                  return (
                    <li key={idx} style={{ marginBottom: '8px', fontSize: '16px', lineHeight: '1.6' }}>
                      {parts.join(' ')}
                    </li>
                  );
                }
              }
              return null;
            })}
          </ul>
        )}
      </section>

      <section>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#666',
          }}
        >
          Instructions
        </h3>
        {instructions.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>No instructions provided</p>
        ) : (
          <ol style={{ margin: 0, paddingLeft: '24px' }}>
            {instructions.map((instruction, idx) => {
              if (typeof instruction === 'string') {
                const str = instruction.trim();
                if (str === '(not provided)' || str === '') return null;
                return (
                  <li key={idx} style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.6' }}>
                    {str}
                  </li>
                );
              }
              if (typeof instruction === 'object' && instruction !== null) {
                if ('section' in instruction) {
                  const section = instruction as { section: { name: string; items: unknown[] } };
                  return (
                    <li key={idx} style={{ marginBottom: '24px', listStyle: 'none' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                        {section.section.name || 'Untitled Section'}
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '24px' }}>
                        {section.section.items.map((item, itemIdx) => {
                          if (typeof item === 'string') {
                            const str = item.trim();
                            if (str === '(not provided)' || str === '') return null;
                            return (
                              <li key={itemIdx} style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.6' }}>
                                {str}
                              </li>
                            );
                          }
                          if (typeof item === 'object' && item !== null && 'text' in item) {
                            const obj = item as { text: string };
                            const text = obj.text?.trim() || '';
                            if (text === '(not provided)' || text === '') return null;
                            return (
                              <li key={itemIdx} style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.6' }}>
                                {text}
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ol>
                    </li>
                  );
                }
                if ('text' in instruction) {
                  const obj = instruction as { text: string };
                  const text = obj.text?.trim() || '';
                  if (text === '(not provided)' || text === '') return null;
                  return (
                    <li key={idx} style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.6' }}>
                      {text}
                    </li>
                  );
                }
              }
              return null;
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function JsonPreview({ recipe }: { recipe: SoustackLiteRecipe }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '13px',
        lineHeight: '1.6',
        overflow: 'auto',
        fontFamily: 'monospace',
      }}
    >
      {JSON.stringify(recipe, null, 2)}
    </pre>
  );
}
