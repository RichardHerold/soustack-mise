'use client';

import { useState, useRef, useEffect } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import type { User } from '@supabase/supabase-js';
import { slugify } from '@/lib/utils/slugify';

type CreatorExportMenuProps = {
  recipe: SoustackLiteRecipe;
  user: User | null;
  savedRecipeId?: string | null;
  publicId?: string | null;
  isPublic?: boolean;
  onCopyJson: () => void;
  onDownload: () => void;
  onGetShareableLink?: () => void;
  onPublish?: () => void;
};

export default function CreatorExportMenu({
  recipe,
  user,
  savedRecipeId,
  publicId,
  isPublic,
  onCopyJson,
  onDownload,
  onGetShareableLink,
  onPublish,
}: CreatorExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyJson = () => {
    onCopyJson();
    setIsOpen(false);
  };

  const handleDownload = () => {
    onDownload();
    setIsOpen(false);
  };

  const handleGetShareableLink = () => {
    if (!user) {
      // Will be handled by parent to show auth prompt
      setIsOpen(false);
      return;
    }
    if (onGetShareableLink) {
      onGetShareableLink();
    }
    setIsOpen(false);
  };

  const handlePublish = () => {
    if (!user) {
      // Will be handled by parent to show auth prompt
      setIsOpen(false);
      return;
    }
    if (onPublish) {
      onPublish();
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 16px',
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

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: '220px',
            zIndex: 1000,
          }}
        >
          <button
            onClick={handleCopyJson}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fafafa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>📋</span> Copy JSON to clipboard
          </button>

          <button
            onClick={handleDownload}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderBottom: user ? '1px solid #e0e0e0' : 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fafafa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>📄</span> Download .soustack.json
          </button>

          {user && (
            <>
              <div
                style={{
                  height: '1px',
                  backgroundColor: '#e0e0e0',
                  margin: '4px 0',
                }}
              />
              <button
                onClick={handleGetShareableLink}
                disabled={!savedRecipeId}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: 'transparent',
                  cursor: savedRecipeId ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: savedRecipeId ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (savedRecipeId) {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={!savedRecipeId ? 'Save recipe first to get shareable link' : undefined}
              >
                <span>🔗</span> Get shareable link
              </button>

              <button
                onClick={handlePublish}
                disabled={!savedRecipeId}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: savedRecipeId ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: savedRecipeId ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (savedRecipeId) {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={!savedRecipeId ? 'Save recipe first to publish' : undefined}
              >
                <span>🌐</span> Publish publicly
                {isPublic && <span style={{ fontSize: '11px', color: '#059669', marginLeft: '4px' }}>✓</span>}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
