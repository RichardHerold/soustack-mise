'use client';

import { useState } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { slugify } from '@/lib/utils/slugify';

type CreatorPreviewProps = {
  recipe: SoustackLiteRecipe;
};

type Tab = 'rendered' | 'json';

export default function CreatorPreview({ recipe }: CreatorPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('rendered');

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(recipe, null, 2));
      // TODO: Show toast notification
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = slugify(recipe.name || 'recipe') + '.soustack.json';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
        <TabButton
          active={activeTab === 'rendered'}
          onClick={() => setActiveTab('rendered')}
        >
          Rendered
        </TabButton>
        <TabButton
          active={activeTab === 'json'}
          onClick={() => setActiveTab('json')}
        >
          JSON
        </TabButton>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {activeTab === 'rendered' && <RenderedTab recipe={recipe} />}
        {activeTab === 'json' && (
          <JsonTab recipe={recipe} onCopy={handleCopyJson} onDownload={handleDownload} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        border: 'none',
        borderBottom: active ? '2px solid #000' : '2px solid transparent',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? '#000' : '#666',
      }}
    >
      {children}
    </button>
  );
}

function RenderedTab({ recipe }: { recipe: SoustackLiteRecipe }) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  // Get mise en place items
  const miseEnPlaceItems: Array<{ text: string }> = [];
  const recipeWithMiseEnPlace = recipe as SoustackLiteRecipe & {
    miseEnPlace?: Array<{ text: string }>;
  };
  if (recipeWithMiseEnPlace.miseEnPlace && Array.isArray(recipeWithMiseEnPlace.miseEnPlace)) {
    recipeWithMiseEnPlace.miseEnPlace.forEach((item) => {
      if (
        typeof item === 'object' &&
        item !== null &&
        'text' in item &&
        typeof item.text === 'string' &&
        item.text.trim().length > 0
      ) {
        miseEnPlaceItems.push({ text: item.text });
      }
    });
  }

  // Get storage data
  const recipeWithStorage = recipe as SoustackLiteRecipe & {
    storage?: unknown;
  };

  return (
    <div>
      <h2
        style={{
          margin: '0 0 24px 0',
          fontSize: '24px',
          fontWeight: 600,
        }}
      >
        {recipe.name}
      </h2>

      {recipe.description && (
        <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#666', lineHeight: '1.6' }}>
          {recipe.description}
        </p>
      )}

      {miseEnPlaceItems.length > 0 && (
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
            Mise en Place
          </h3>
          <ul style={{ margin: 0, paddingLeft: '24px', listStyle: 'none' }}>
            {miseEnPlaceItems.map((item, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: '8px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '18px',
                    height: '18px',
                    border: '2px solid #666',
                    borderRadius: '3px',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
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
                  <li
                    key={idx}
                    style={{
                      marginBottom: '8px',
                      fontSize: '16px',
                      lineHeight: '1.6',
                    }}
                  >
                    {str}
                  </li>
                );
              }
              if (typeof ingredient === 'object' && ingredient !== null) {
                if ('section' in ingredient) {
                  const section = ingredient as { section: { name: string; items: unknown[] } };
                  return (
                    <li key={idx} style={{ marginBottom: '24px' }}>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '8px',
                          color: '#333',
                        }}
                      >
                        {section.section.name || 'Untitled Section'}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '24px', listStyle: 'none' }}>
                        {section.section.items.map((item, itemIdx) => {
                          if (typeof item === 'string') {
                            return (
                              <li
                                key={itemIdx}
                                style={{
                                  marginBottom: '8px',
                                  fontSize: '16px',
                                  lineHeight: '1.6',
                                }}
                              >
                                {item}
                              </li>
                            );
                          }
                          if (typeof item === 'object' && item !== null && 'name' in item) {
                            const obj = item as {
                              quantity?: string | number;
                              unit?: string;
                              name: string;
                              scaling?: { mode?: string };
                            };
                            const parts: string[] = [];
                            if (obj.quantity) parts.push(String(obj.quantity));
                            if (obj.unit) parts.push(obj.unit);
                            parts.push(obj.name);
                            if (obj.scaling?.mode === 'toTaste') {
                              parts.push('(to taste)');
                            }
                            return (
                              <li
                                key={itemIdx}
                                style={{
                                  marginBottom: '8px',
                                  fontSize: '16px',
                                  lineHeight: '1.6',
                                }}
                              >
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
                  const obj = ingredient as {
                    quantity?: string | number;
                    unit?: string;
                    name: string;
                    scaling?: { mode?: string };
                  };
                  const parts: string[] = [];
                  if (obj.quantity) parts.push(String(obj.quantity));
                  if (obj.unit) parts.push(obj.unit);
                  parts.push(obj.name);
                  if (obj.scaling?.mode === 'toTaste') {
                    parts.push('(to taste)');
                  }
                  return (
                    <li
                      key={idx}
                      style={{
                        marginBottom: '8px',
                        fontSize: '16px',
                        lineHeight: '1.6',
                      }}
                    >
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
                  <li
                    key={idx}
                    style={{
                      marginBottom: '12px',
                      fontSize: '16px',
                      lineHeight: '1.6',
                    }}
                  >
                    {str}
                  </li>
                );
              }
              if (typeof instruction === 'object' && instruction !== null) {
                if ('section' in instruction) {
                  const section = instruction as { section: { name: string; items: unknown[] } };
                  return (
                    <li key={idx} style={{ marginBottom: '24px', listStyle: 'none' }}>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '12px',
                          color: '#333',
                        }}
                      >
                        {section.section.name || 'Untitled Section'}
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '24px' }}>
                        {section.section.items.map((item, itemIdx) => {
                          if (typeof item === 'string') {
                            const str = item.trim();
                            if (str === '(not provided)' || str === '') return null;
                            return (
                              <li
                                key={itemIdx}
                                style={{
                                  marginBottom: '12px',
                                  fontSize: '16px',
                                  lineHeight: '1.6',
                                }}
                              >
                                {str}
                              </li>
                            );
                          }
                          if (typeof item === 'object' && item !== null && 'text' in item) {
                            const obj = item as { text: string };
                            const text = obj.text?.trim() || '';
                            if (text === '(not provided)' || text === '') return null;
                            return (
                              <li
                                key={itemIdx}
                                style={{
                                  marginBottom: '12px',
                                  fontSize: '16px',
                                  lineHeight: '1.6',
                                }}
                              >
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
                    <li
                      key={idx}
                      style={{
                        marginBottom: '12px',
                        fontSize: '16px',
                        lineHeight: '1.6',
                      }}
                    >
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

      {recipeWithStorage.storage !== undefined && recipeWithStorage.storage !== null && (
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
            Storage & Leftovers
          </h3>
          <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
            {typeof recipeWithStorage.storage === 'string' ? (
              <p>{String(recipeWithStorage.storage)}</p>
            ) : (
              <pre style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                {JSON.stringify(recipeWithStorage.storage, null, 2)}
              </pre>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function JsonTab({
  recipe,
  onCopy,
  onDownload,
}: {
  recipe: SoustackLiteRecipe;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCopy}
          style={{
            padding: '8px 16px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Copy JSON
        </button>
        <button
          onClick={onDownload}
          style={{
            padding: '8px 16px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Download .soustack.json
        </button>
      </div>
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
    </div>
  );
}
