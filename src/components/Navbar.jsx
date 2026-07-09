import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { LayoutDashboard, FileText, ToggleLeft, ToggleRight, Sun, Moon } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { formActive } = useAppState();
  const [isLight, setIsLight] = useState(false);

  // Toggle theme helper
  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  return (
    <nav className="glass-panel" style={{
      margin: '1rem 1.5rem 0',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 10
    }}>
      {/* Brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>Ω</span>
        </div>
        <span className="title-gradient" style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.05em'
        }}>
          LIMKOKWING
        </span>
      </div>

      {/* Tabs / Routing links */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => setActiveTab('form')}
          className={`btn btn-sm ${activeTab === 'form' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '0.35rem' }}
        >
          <FileText size={16} />
          Student Form
          {formActive ? (
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 8px var(--success)',
              marginLeft: '0.25rem'
            }} />
          ) : (
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--danger)',
              boxShadow: '0 0 8px var(--danger)',
              marginLeft: '0.25rem'
            }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`btn btn-sm ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ gap: '0.35rem' }}
        >
          <LayoutDashboard size={16} />
          Admin Console
        </button>
      </div>

      {/* Utility switches */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          className="btn-secondary"
          title="Toggle light/dark theme"
        >
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
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
