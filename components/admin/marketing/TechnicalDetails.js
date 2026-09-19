'use client';

import { useState } from 'react';

export default function TechnicalDetails({
  title = 'Advanced & Developer Details',
  summary = 'View raw IDs, event streams, payload data, and technical diagnostic tools.',
  badge,
  defaultOpen = false,
  id,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="admin-panel admin-tech-panel" id={id}>
      <details
        className="admin-tech-details"
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
      >
        <summary className="admin-tech-summary">
          <div className="admin-tech-summary-left">
            <span className="admin-tech-icon" aria-hidden="true">
              ⚙️
            </span>
            <div>
              <div className="admin-tech-title-row">
                <strong className="admin-tech-title">{title}</strong>
                {badge && <span className="admin-count-badge">{badge}</span>}
              </div>
              <p className="admin-muted admin-tech-copy">{summary}</p>
            </div>
          </div>
          <span className="admin-tech-toggle-indicator">
            {isOpen ? 'Hide technical data ▲' : 'Show technical data ▼'}
          </span>
        </summary>

        <div className="admin-tech-content">{children}</div>
      </details>
    </section>
  );
}
