'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { PAGE_HELP_CONTENTS } from '../../../src/lib/admin/marketing-copy';

export interface HelpDrawerProps {
  pageKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpDrawer({ pageKey, isOpen, onClose }: HelpDrawerProps) {
  const content = PAGE_HELP_CONTENTS[pageKey] || {
    title: 'Marketing Guide',
    summary: 'Understand your marketing performance and customer journey.',
    whatToLookAt: ['Check the primary business metrics.', 'Review what is working and what needs attention.'],
    whatNumbersMean: [],
    goodResult: 'Consistent growth in orders and healthy return on ad spend.',
    whatToDoIfLow: 'Inspect your sales journey to see where customers are dropping off.',
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="admin-drawer-overlay" onClick={onClose} aria-hidden={!isOpen}>
      <aside
        className="admin-help-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-help-drawer-header">
          <div>
            <span className="admin-eyebrow">Business Guide</span>
            <h2 id="help-drawer-title">{content.title}</h2>
          </div>
          <button
            type="button"
            className="admin-help-drawer-close"
            onClick={onClose}
            aria-label="Close guide"
          >
            ✕
          </button>
        </header>

        <div className="admin-help-drawer-body">
          <section className="admin-help-section">
            <h3>What is this page?</h3>
            <p>{content.summary}</p>
          </section>

          <section className="admin-help-section">
            <h3>What should I look at?</h3>
            <ul className="admin-help-list">
              {content.whatToLookAt.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          {content.whatNumbersMean.length > 0 && (
            <section className="admin-help-section">
              <h3>What do these numbers mean?</h3>
              <dl className="admin-help-glossary">
                {content.whatNumbersMean.map((item, idx) => (
                  <div key={idx} className="admin-help-glossary-item">
                    <dt>{item.label}</dt>
                    <dd>{item.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="admin-help-section admin-help-highlight-box">
            <h3>What does a good result look like?</h3>
            <p>{content.goodResult}</p>
          </section>

          <section className="admin-help-section admin-help-action-box">
            <h3>What should I do if numbers are low?</h3>
            <p>{content.whatToDoIfLow}</p>
          </section>

          <footer className="admin-help-drawer-footer">
            <Link
              href="/admin/marketing/help"
              className="admin-secondary-button"
              style={{ width: '100%', textAlign: 'center', display: 'block' }}
              onClick={onClose}
            >
              📖 View All Tutorials & Guides →
            </Link>
          </footer>
        </div>
      </aside>
    </div>
  );
}
