'use client';

import { useState } from 'react';

type ConvertDialogProps = {
  onConfirm: (preserveProse: boolean) => void;
  onCancel: () => void;
};

export default function ConvertDialog({
  onConfirm,
  onCancel,
}: ConvertDialogProps) {
  const [preserveProse, setPreserveProse] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          Convert to Structured Mode
        </h3>
        <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
          This will switch to structured editing mode. Raw text will no longer
          drive recipe computation.
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '24px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={preserveProse}
            onChange={(e) => setPreserveProse(e.target.checked)}
            style={{ marginTop: '2px' }}
          />
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>
              Preserve original prose in recipe metadata
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Stored under x-mise.prose. Never used for computation.
            </div>
          </div>
        </label>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(preserveProse)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#000',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );
}

