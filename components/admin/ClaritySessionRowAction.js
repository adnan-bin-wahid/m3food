'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ClaritySessionRowAction({ sessionKey, clarityId }) {
  const [copied, setCopied] = useState(false);

  const handleCopyAndOpen = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(sessionKey);
      } else {
        const input = document.createElement('input');
        input.value = sessionKey;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open(`https://clarity.microsoft.com/projects/view/${clarityId}/recordings`, '_blank');
  };

  return (
    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
      <Link
        href={`/admin/marketing/visitors/${encodeURIComponent(sessionKey)}`}
        className="admin-button"
        style={{
          padding: '6px 12px',
          minHeight: '32px',
          fontSize: '12px',
          background: '#e9f0e8',
          color: '#1f4526',
          textDecoration: 'none',
          borderRadius: '6px',
        }}
      >
        Timeline
      </Link>
      {clarityId && (
        <button
          type="button"
          onClick={handleCopyAndOpen}
          className="admin-button"
          title="Copies session ID to clipboard and opens Clarity recordings in a new tab"
          style={{
            padding: '6px 12px',
            minHeight: '32px',
            fontSize: '12px',
            background: copied ? '#107c41' : '#0078d4',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {copied ? '✓ ID Copied & Opening…' : '🎥 Replay in Clarity ↗'}
        </button>
      )}
    </div>
  );
}
