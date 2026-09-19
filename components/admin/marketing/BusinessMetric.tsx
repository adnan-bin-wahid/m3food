'use client';

import React, { useState } from 'react';

export interface BusinessMetricProps {
  title?: string;
  label?: string; // fallback
  value: React.ReactNode;
  subtitle?: string;
  tooltip?: string;
  technicalLabel?: string;
  technicalName?: string; // fallback
  status?: 'good' | 'neutral' | 'attention' | 'success' | 'info';
  delta?: {
    text: string;
    isPositive: boolean;
    comparison?: string;
  };
  accent?: boolean;
}

export default function BusinessMetric({
  title,
  label,
  value,
  subtitle,
  tooltip,
  technicalLabel,
  technicalName,
  status = 'neutral',
  delta,
  accent = false,
}: BusinessMetricProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const metricTitle = title || label;
  const techTag = technicalLabel || technicalName;

  const statusClass =
    status === 'good' || status === 'success'
      ? 'admin-metric-status-good'
      : status === 'attention'
      ? 'admin-metric-status-attention'
      : status === 'info'
      ? 'admin-metric-status-info'
      : '';

  return (
    <article
      className={`admin-metric-card ${accent ? 'admin-metric-card-accent' : ''} ${statusClass}`}
    >
      <div className="admin-metric-header-row">
        <span className="admin-metric-title">{metricTitle}</span>
        {tooltip && (
          <div className="admin-tooltip-container">
            <button
              type="button"
              className="admin-tooltip-trigger"
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              aria-label={`Information about ${metricTitle}`}
            >
              ℹ️
            </button>
            {showTooltip && (
              <div className="admin-tooltip-bubble" role="tooltip">
                <p className="admin-tooltip-plain">{tooltip}</p>
                {techTag && (
                  <p className="admin-tooltip-technical">
                    Technical: <code>{techTag}</code>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <strong className="admin-metric-value">{value}</strong>

      <div className="admin-metric-footer">
        {delta && (
          <span
            className={`admin-metric-delta ${
              delta.isPositive ? 'is-positive' : 'is-negative'
            }`}
          >
            {delta.isPositive ? '↑' : '↓'} {delta.text}{' '}
            {delta.comparison && <small>{delta.comparison}</small>}
          </span>
        )}

        {subtitle && <small className="admin-metric-subtitle">{subtitle}</small>}

        {techTag && !tooltip && (
          <span className="admin-metric-tech-tag">{techTag}</span>
        )}
      </div>
    </article>
  );
}
