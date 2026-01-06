'use client';

type RawDraftEditorProps = {
  value: string;
  onChange: (text: string) => void;
};

const PLACEHOLDER = `Paste or type a recipe here…

Best Eggs
Ingredients:
- 2 eggs
- salt
Instructions:
1. Crack eggs
2. Cook in pan`;

export default function RawDraftEditor({ value, onChange }: RawDraftEditorProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
          Raw Draft
        </h2>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        style={{
          flex: 1,
          padding: '16px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          backgroundColor: '#fafafa',
        }}
      />
    </div>
  );
}

