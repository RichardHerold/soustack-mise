'use client';

import { useState } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type PreviewTabsProps = {
  recipe: SoustackLiteRecipe;
  parse: { confidence: number; mode: string } | null;
};

type Tab = 'preview' | 'json' | 'parse' | 'prose';

export default function PreviewTabs({ recipe, parse }: PreviewTabsProps) {
  const hasProse = !!recipe['x-mise']?.prose?.text;
  const [activeTab, setActiveTab] = useState<Tab>('preview');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
        <TabButton
          active={activeTab === 'preview'}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </TabButton>
        <TabButton
          active={activeTab === 'json'}
          onClick={() => setActiveTab('json')}
        >
          JSON
        </TabButton>
        <TabButton
          active={activeTab === 'parse'}
          onClick={() => setActiveTab('parse')}
        >
          Parse
        </TabButton>
        {hasProse && (
          <TabButton
            active={activeTab === 'prose'}
            onClick={() => setActiveTab('prose')}
          >
            Prose
          </TabButton>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {activeTab === 'preview' && <PreviewTab recipe={recipe} />}
        {activeTab === 'json' && <JsonTab recipe={recipe} />}
        {activeTab === 'parse' && <ParseTab parse={parse} />}
        {activeTab === 'prose' && hasProse && <ProseTab recipe={recipe} />}
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

function PreviewTab({ recipe }: { recipe: SoustackLiteRecipe }) {
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];
  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : [];

  // Get mise en place items if prep@1 stack is enabled
  const miseEnPlaceItems: Array<{ text: string }> = [];
  if ('prep@1' in recipe.stacks && recipe.stacks['prep@1'] !== undefined) {
    const prepData = recipe.stacks['prep@1'];
    if (Array.isArray(prepData)) {
      prepData.forEach((item) => {
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
  }

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
        <ul style={{ margin: 0, paddingLeft: '24px' }}>
          {ingredients.map((ingredient, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: '8px',
                fontSize: '16px',
                lineHeight: '1.6',
              }}
            >
              {String(ingredient)}
            </li>
          ))}
        </ul>
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
        <ol style={{ margin: 0, paddingLeft: '24px' }}>
          {instructions.map((instruction, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: '12px',
                fontSize: '16px',
                lineHeight: '1.6',
              }}
            >
              {String(instruction)}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function JsonTab({ recipe }: { recipe: SoustackLiteRecipe }) {
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

function ParseTab({ parse }: { parse: { confidence: number; mode: string } | null }) {
  if (!parse) {
    return (
      <div>
        <p style={{ margin: 0, color: '#666' }}>No parse metadata available.</p>
        <p style={{ margin: '16px 0 0 0', color: '#666' }}>
          Always-valid lite ✓
        </p>
      </div>
    );
  }

  const confidencePercent = Math.round(parse.confidence * 100);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#666',
            marginBottom: '8px',
          }}
        >
          Parse Mode
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>
          {parse.mode}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#666',
            marginBottom: '8px',
          }}
        >
          Confidence
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>
          {confidencePercent}%
        </div>
      </div>

      <div
        style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '4px',
          border: '1px solid #bae6fd',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          Always-valid lite ✓
        </div>
        <div style={{ fontSize: '13px', color: '#666' }}>
          This recipe is always valid, even with missing or incomplete data.
        </div>
      </div>
    </div>
  );
}

function ProseTab({ recipe }: { recipe: SoustackLiteRecipe }) {
  const prose = recipe['x-mise']?.prose;
  if (!prose) {
    return null;
  }

  const capturedDate = new Date(prose.capturedAt);
  const formattedDate = capturedDate.toLocaleString();

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#666',
            marginBottom: '8px',
          }}
        >
          Captured At
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>{formattedDate}</div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#666',
            marginBottom: '8px',
          }}
        >
          Original Prose
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#666',
            fontStyle: 'italic',
            marginBottom: '16px',
          }}
        >
          This is non-executable metadata. Never used for computation.
        </div>
      </div>

      <textarea
        readOnly
        value={prose.text}
        style={{
          width: '100%',
          minHeight: '300px',
          padding: '16px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'monospace',
          lineHeight: '1.6',
          backgroundColor: '#fafafa',
          resize: 'vertical',
        }}
      />
    </div>
  );
}

