'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMessage('Check your email for the magic link!');
      setEmail('');
    } catch (error: any) {
      setMessage(error.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error: any) {
      setMessage(error.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
        Checking auth...
      </div>
    );
  }

  if (user) {
    return (
      <div
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '14px', color: '#666' }}>
          Signed in as <strong>{user.email}</strong>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          style={{
            padding: '6px 12px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <form onSubmit={handleSignIn} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#000',
            color: '#fff',
            cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: loading || !email.trim() ? 0.5 : 1,
          }}
        >
          {loading ? 'Sending...' : 'Sign In'}
        </button>
      </form>
      {message && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            fontSize: '13px',
            color: message.includes('Check') ? '#059669' : '#dc2626',
            backgroundColor: message.includes('Check')
              ? '#d1fae5'
              : '#fee2e2',
            borderRadius: '4px',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

