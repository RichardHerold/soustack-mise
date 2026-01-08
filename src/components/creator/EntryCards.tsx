'use client';

type EntryCardsProps = {
  onSelect: (mode: 'paste' | 'scratch' | 'import') => void;
};

export default function EntryCards({ onSelect }: EntryCardsProps) {
  return (
    <div
      style={{
        maxWidth: '600px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <button
        type="button"
        onClick={() => onSelect('paste')}
        style={{
          padding: '24px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#000';
          e.currentTarget.style.backgroundColor = '#fafafa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.backgroundColor = '#fff';
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
          Paste a recipe
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Got a recipe from somewhere? Paste it here and we&apos;ll structure it for you.
        </div>
      </button>

      <button
        onClick={() => onSelect('scratch')}
        style={{
          padding: '24px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#000';
          e.currentTarget.style.backgroundColor = '#fafafa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.backgroundColor = '#fff';
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✏️</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
          Start from scratch
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Build your recipe step by step, organizing ingredients and instructions as you go.
        </div>
      </button>

      <button
        onClick={() => onSelect('import')}
        style={{
          padding: '24px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#000';
          e.currentTarget.style.backgroundColor = '#fafafa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.backgroundColor = '#fff';
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
          Import file
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Upload a .txt, .json, or .md file
        </div>
      </button>
    </div>
  );
}
