'use client';

type InputMethod = 'paste' | 'build';

type InputMethodToggleProps = {
  inputMethod: InputMethod;
  onChange: (method: InputMethod) => void;
  showReParse?: boolean;
  onReParse?: () => void;
};

export default function InputMethodToggle({
  inputMethod,
  onChange,
  showReParse = false,
  onReParse,
}: InputMethodToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '12px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#fafafa',
      }}
    >
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#666' }}>
          Input Method:
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <input
              type="radio"
              name="inputMethod"
              value="paste"
              checked={inputMethod === 'paste'}
              onChange={() => onChange('paste')}
              style={{ cursor: 'pointer' }}
            />
            Paste text
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <input
              type="radio"
              name="inputMethod"
              value="build"
              checked={inputMethod === 'build'}
              onChange={() => onChange('build')}
              style={{ cursor: 'pointer' }}
            />
            Build step-by-step
          </label>
        </div>
      </div>
      {showReParse && onReParse && (
        <button
          onClick={onReParse}
          style={{
            padding: '6px 12px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#666',
          }}
          title="Re-parse the textarea content and overwrite the current recipe"
        >
          Re-parse from text
        </button>
      )}
    </div>
  );
}
