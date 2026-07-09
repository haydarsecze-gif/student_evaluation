import React, { useState } from 'react';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import Navbar from './components/Navbar';
import FormPage from './components/FormPage';
import AdminDashboard from './components/AdminDashboard';
import { Loader2, ServerCrash } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'admin'
  const { loading, fetchError } = useAppState();

  // Premium loading state overlay
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        gap: '1rem'
      }}>
        <div className="glass-panel" style={{
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Loader2 className="animate-spin" size={40} color="var(--primary)" style={{ animationDuration: '1.5s' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Syncing with Database...</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Loading parameters from Supabase backend</div>
        </div>
      </div>
    );
  }

  // Premium database load error page
  if (fetchError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        padding: '1.5rem'
      }}>
        <div className="glass-panel" style={{
          padding: '3rem',
          maxWidth: '550px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          borderLeft: '4px solid var(--danger)',
          background: 'rgba(239, 68, 68, 0.03)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--danger-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--danger)',
            marginBottom: '0.5rem'
          }}>
            <ServerCrash size={32} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Database Connection Error</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Failed to establish connection with Supabase. Please make sure you have executed the database setup SQL commands in your Supabase SQL Editor.
          </p>
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            width: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            textAlign: 'left',
            overflowX: 'auto',
            color: '#f87171',
            border: '1px solid var(--border-color)'
          }}>
            Error Details: {fetchError}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary btn-sm"
            style={{ marginTop: '1rem' }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main page layout */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'form' ? <FormPage /> : <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="glass-panel" style={{
        margin: '0 1.5rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div>&copy; {new Date().getFullYear()} Aura Academia Systems. All rights reserved.</div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
          Supabase Database Synced. Program Cycle Rules: Foundation (2 Semesters) &amp; Degree (6 Semesters).
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
