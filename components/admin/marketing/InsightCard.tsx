import React from 'react';
import Link from 'next/link';

export interface InsightCardProps {
  type?: 'working' | 'attention' | 'opportunity';
  title?: string;
  message?: string;
  description?: string; // fallback
  detail?: string;
  smallSample?: boolean;
  sampleNote?: string;
  actionLabel?: string;
  actionText?: string; // fallback
  actionHref?: string;
}

export default function InsightCard({
  type = 'working',
  title,
  message,
  description,
  detail,
  smallSample = false,
  sampleNote,
  actionLabel,
  actionText,
  actionHref,
}: InsightCardProps) {
  const explanation = message || description;
  const actionBtnText = actionLabel || actionText;

  const typeIcons: Record<string, string> = {
    working: '✅',
    attention: '⚠️',
    opportunity: '💡',
  };

  const typeClass =
    type === 'working'
      ? 'admin-insight-working'
      : type === 'attention'
      ? 'admin-insight-attention'
      : 'admin-insight-opportunity';

  return (
    <div className={`admin-insight-card ${typeClass}`}>
      <div className="admin-insight-header">
        <span className="admin-insight-icon" aria-hidden="true">
          {typeIcons[type] || '📌'}
        </span>
        {title && <strong className="admin-insight-title">{title}</strong>}
      </div>

      {explanation && <p className="admin-insight-message">{explanation}</p>}

      {detail && <p className="admin-insight-detail">{detail}</p>}

      {smallSample && (
        <p className="admin-insight-sample-guard">
          ℹ️ {sampleNote || 'Based on a small number of orders. More data is needed before drawing firm conclusions.'}
        </p>
      )}

      {actionBtnText && actionHref && (
        <div className="admin-insight-action">
          <Link href={actionHref} className="admin-insight-action-link">
            {actionBtnText} →
          </Link>
        </div>
      )}
    </div>
  );
}
