'use client';

import React, { useState } from 'react';
import HelpDrawer from './HelpDrawer';

export interface PageIntroProps {
  pageKey: string;
  eyebrow?: string;
  title: string;
  description?: string;
  subtitle?: string; // fallback
  controls?: React.ReactNode;
  datePicker?: React.ReactNode; // fallback
  badge?: string | number;
  children?: React.ReactNode; // fallback
  advancedAnchor?: string;
  advancedLabel?: string;
}

export default function PageIntro({
  pageKey,
  eyebrow = 'Growth & Marketing',
  title,
  description,
  subtitle,
  controls,
  datePicker,
  badge,
  children,
  advancedAnchor,
  advancedLabel = 'Advanced details',
}: PageIntroProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const descText = description || subtitle;
  const controlElements = controls || datePicker || children;

  return (
    <div className="admin-page-intro-wrapper">
      <header className="admin-page-header admin-page-intro">
        <div className="admin-page-intro-text">
          {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
          <div className="admin-page-title-row">
            <h1>{title}</h1>
            {badge && <span className="admin-count-badge">{badge}</span>}
          </div>
          {descText && <p className="admin-muted admin-header-copy">{descText}</p>}
          <div className="admin-page-actions-row">
            <button
              type="button"
              className="admin-explain-button"
              onClick={() => setIsHelpOpen(true)}
              aria-label={`Explain ${title}`}
            >
              💡 Explain this page
            </button>
            {advancedAnchor && (
              <a href={advancedAnchor} className="admin-text-link-subtle">
                ⚙️ {advancedLabel}
              </a>
            )}
          </div>
        </div>

        {controlElements && <div className="admin-page-intro-controls">{controlElements}</div>}
      </header>

      <HelpDrawer
        pageKey={pageKey}
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
