'use client';

import { useState } from 'react';

export default function ClarityQuickActions({ clarityProjectId, sessionKey, visitorKey }) {
  const [copied, setCopied] = useState(false);

  const copySession = async () => {
    if (!sessionKey) return;
    try {
      await navigator.clipboard.writeText(sessionKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const recordingsUrl = clarityProjectId
    ? `https://clarity.microsoft.com/projects/view/${clarityProjectId}/recordings`
    : '#';
  const heatmapsUrl = clarityProjectId
    ? `https://clarity.microsoft.com/projects/view/${clarityProjectId}/heatmaps`
    : '#';

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      <a
        href={recordingsUrl}
        target="_blank"
        rel="noreferrer"
        className="admin-button"
        style={{
          background: '#0078d4',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
        }}
      >
        <span>🎥 Clarity Recordings</span>
        <span>↗</span>
      </a>

      <a
        href={heatmapsUrl}
        target="_blank"
        rel="noreferrer"
        className="admin-button"
        style={{
          background: '#d83b01',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
        }}
      >
        <span>🔥 Clarity Heatmaps</span>
        <span>↗</span>
      </a>

      {sessionKey && (
        <button
          type="button"
          onClick={copySession}
          className="admin-button admin-button-secondary"
          style={{
            fontSize: '13px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: copied ? '#e6f7ec' : undefined,
            borderColor: copied ? '#147d3b' : undefined,
            color: copied ? '#147d3b' : undefined,
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Session ID Copied!' : '📋 Copy Session ID for Filter'}
        </button>
      )}
    </div>
  );
}
