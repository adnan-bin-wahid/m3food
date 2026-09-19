import React from 'react';
import { EVENT_TRANSLATIONS } from '../../../src/lib/admin/marketing-copy';

export interface FunnelStage {
  key?: string;
  label?: string;
  value?: number;
  rate?: number | string;
  tech?: string;
  stepNumber?: number;
}

export interface BusinessFunnelProps {
  stages?: FunnelStage[];
  steps?: FunnelStage[]; // fallback
  conversionRate?: number;
  totalVisitors?: number;
  totalOrders?: number;
  opportunityText?: string | null;
  dropoffCallout?: string | null; // fallback
  currency?: string;
}

export default function BusinessFunnel({
  stages = [],
  steps,
  conversionRate,
  totalVisitors,
  totalOrders,
  opportunityText,
  dropoffCallout,
  currency = 'BDT',
}: BusinessFunnelProps) {
  const rawStages = (stages && stages.length ? stages : steps) || [];
  const oppText = opportunityText || dropoffCallout;

  const defaultStages: Array<{ key: string; label: string; tech: string }> = [
    { key: 'visitors', label: '1. Visited store', tech: 'PAGE_VIEW' },
    { key: 'view_content', label: '2. Viewed product', tech: 'VIEW_CONTENT' },
    { key: 'add_to_cart', label: '3. Showed buying intent', tech: 'ADD_TO_CART' },
    { key: 'begin_checkout', label: '4. Started ordering', tech: 'BEGIN_CHECKOUT' },
    { key: 'purchase', label: '5. Completed order', tech: 'PURCHASE' },
  ];

  const visitorsCount =
    totalVisitors !== undefined
      ? totalVisitors
      : (rawStages[0]?.value ?? 0);

  const ordersCount =
    totalOrders !== undefined
      ? totalOrders
      : (rawStages[rawStages.length - 1]?.value ?? 0);

  const calculatedRate =
    conversionRate !== undefined
      ? conversionRate
      : visitorsCount > 0
      ? (ordersCount / visitorsCount) * 100
      : 0;

  const renderedStages = rawStages.map((s, idx) => {
    const translation = EVENT_TRANSLATIONS[s.key?.toUpperCase() || ''] || {};
    const label = s.label || translation.businessLabel || defaultStages[idx]?.label;
    const tech = translation.technicalEvent || defaultStages[idx]?.tech;
    const previous = idx === 0 ? s.value : rawStages[idx - 1]?.value;
    const continuationRate =
      (previous && previous > 0 && typeof s.value === 'number')
        ? ((s.value / previous) * 100).toFixed(1)
        : (s.rate !== undefined ? Number(s.rate).toFixed(1) : '0.0');

    return {
      ...s,
      label,
      tech,
      rate: continuationRate,
      stepNumber: idx + 1,
    };
  });

  return (
    <div className="admin-business-funnel-wrapper">
      <div className="admin-funnel-stages-row">
        {renderedStages.map((stage, idx) => (
          <div key={stage.key || idx} className="admin-funnel-step-card">
            <div className="admin-funnel-step-header">
              <span className="admin-funnel-step-num">Step {stage.stepNumber}</span>
              {idx > 0 && (
                <span className="admin-funnel-step-rate">{stage.rate}% continued</span>
              )}
            </div>
            <strong className="admin-funnel-step-value">{(stage.value || 0).toLocaleString()}</strong>
            <span className="admin-funnel-step-title">{stage.label}</span>
            {stage.tech && (
              <small className="admin-funnel-step-tech">
                Tracked as: <code>{stage.tech.split(' ')[0]}</code>
              </small>
            )}
            {idx < renderedStages.length - 1 && (
              <div className="admin-funnel-step-arrow" aria-hidden="true">
                →
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-funnel-summary-box">
        <div className="admin-funnel-summary-metric">
          <span>Overall Conversion Rate</span>
          <strong>{Number(calculatedRate).toFixed(1)}%</strong>
          <small>
            {ordersCount} orders from {visitorsCount.toLocaleString()} visitors
          </small>
        </div>

        {oppText && (
          <div className="admin-funnel-opportunity">
            <div className="admin-opportunity-header">
              <span aria-hidden="true">💡</span>
              <strong>Biggest Opportunity</strong>
            </div>
            <p>{oppText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
