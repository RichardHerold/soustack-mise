'use client';

type InlineHintProps = {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

/**
 * InlineHint - Calm, advisory hint component
 * - No red/yellow warnings
 * - Optional action button
 * - Appears contextually near relevant sections
 */
export default function InlineHint({ message, action }: InlineHintProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#0369a1',
        marginTop: '8px',
      }}
    >
      <span>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '4px 8px',
            border: '1px solid #0284c7',
            borderRadius: '3px',
            backgroundColor: '#fff',
            color: '#0284c7',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
