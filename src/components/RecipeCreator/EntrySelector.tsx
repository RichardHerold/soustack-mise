'use client';

type EntrySelectorProps = {
  onSelect: (mode: 'paste' | 'build') => void;
};

export default function EntrySelector({ onSelect }: EntrySelectorProps) {
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
      <div
        style={{
          fontSize: '24px',
          fontWeight: 600,
          marginBottom: '8px',
          textAlign: 'center',
        }}
      >
        How would you like to start?
      </div>

      <button
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
        onClick={() => onSelect('build')}
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
          Build your recipe step by step with our guided editor.
        </div>
      </button>
    </div>
  );
}
