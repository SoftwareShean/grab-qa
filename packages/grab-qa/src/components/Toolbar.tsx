'use client';

import React from 'react';
import { useQAFlow } from '../context';

export function QAFlowToolbar() {
  const {
    isEnabled,
    isGrabbing,
    isPanelOpen,
    annotations,
    toggleGrabMode,
    togglePanel,
    disable,
  } = useQAFlow();

  if (!isEnabled) return null;

  const unresolvedCount = annotations.filter((a) => !a.resolved).length;

  return (
    <div
      data-qaflow="toolbar"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#1f2937',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 999999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
      }}
    >
      <button
        onClick={toggleGrabMode}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: isGrabbing ? '#3b82f6' : '#374151',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'all 0.15s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        {isGrabbing ? 'Grabbing...' : 'Grab Element'}
      </button>

      <button
        onClick={togglePanel}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: isPanelOpen ? '#3b82f6' : '#374151',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 500,
          position: 'relative',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Issues
        {unresolvedCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              background: '#ef4444',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unresolvedCount}
          </span>
        )}
      </button>

      <div style={{ width: '1px', height: '24px', background: '#4b5563' }} />

      <button
        onClick={disable}
        style={{
          padding: '8px',
          background: 'transparent',
          color: '#9ca3af',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
        title="Close QAFlow (Alt+Q)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
