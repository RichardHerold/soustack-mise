'use client';

import { useState, useEffect } from 'react';

export default function CreatorPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 600 }}>🥣 Soustack Creator</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Save
          </button>
          <button
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Export <span style={{ fontSize: '10px' }}>▼</span>
          </button>
        </div>
      </div>

      {/* Name and Description */}
      <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="Recipe Name"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              fontSize: '16px',
              outline: 'none',
            }}
          />
        </div>
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Main Body */}
      {isMobile ? (
        <>
          {/* Mobile Tab Switcher */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fff',
            }}
          >
            <button
              onClick={() => setActiveTab('editor')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderBottom: activeTab === 'editor' ? '2px solid #000' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'editor' ? 600 : 400,
                color: activeTab === 'editor' ? '#000' : '#666',
              }}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderBottom: activeTab === 'preview' ? '2px solid #000' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'preview' ? 600 : 400,
                color: activeTab === 'preview' ? '#000' : '#666',
              }}
            >
              Preview
            </button>
          </div>

          {/* Mobile Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {activeTab === 'editor' && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                Editor goes here
              </div>
            )}
            {activeTab === 'preview' && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                Preview goes here
              </div>
            )}
          </div>

          {/* Mobile Footer with Save + Export */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between',
            }}
          >
            <button
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Save
            </button>
            <button
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              Export <span style={{ fontSize: '10px' }}>▼</span>
            </button>
          </div>
        </>
      ) : (
        /* Desktop Two-Pane Layout */
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* Editor Pane (60%) */}
          <div
            style={{
              flex: '0 0 60%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              padding: '24px',
              borderRight: '1px solid #e0e0e0',
            }}
          >
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              Editor goes here
            </div>
          </div>

          {/* Preview Pane (40%) */}
          <div
            style={{
              flex: '0 0 40%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              Preview goes here
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
