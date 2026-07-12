import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { formActive } = useAppState();
  const [isDark, setIsDark] = useState(false);

  // Toggle theme helper
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };

  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: '0.75rem',
      margin: '0.75rem 0 0',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1000
    }}>
      {/* Brand logo (No icons, no gradients) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="title-gradient" style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.05em'
        }}>
          LIMKOKWING
        </span>
      </div>

      {/* Tabs / Routing links (No icons) */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => setActiveTab('form')}
          className={`btn btn-sm ${activeTab === 'form' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '0.35rem' }}
        >
          Student Form
          {formActive ? (
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
              marginLeft: '0.25rem'
            }} />
          ) : (
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
              marginLeft: '0.25rem'
            }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`btn btn-sm ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Admin Console
        </button>
      </div>

      {/* Utility switches */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {/* Theme Switcher (Text-only, no icons) */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '9999px',
            padding: '0.4rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all var(--transition-fast)'
          }}
          className="btn-secondary"
          title="Toggle light/dark theme"
        >
          {isDark ? 'LIGHT' : 'DARK'}
        </button>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Portal:</span>
          {formActive ? (
            <span className="badge badge-success">ACTIVE</span>
          ) : (
            <span className="badge badge-danger">CLOSED</span>
          )}
        </div>
      </div>
    </nav>
  );
}
