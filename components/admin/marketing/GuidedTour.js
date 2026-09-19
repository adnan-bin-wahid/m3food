'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GuidedTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('niyamah_marketing_tour_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    } catch {
      // localStorage may fail in restricted iframes or private modes
    }
  }, []);

  function handleDismiss() {
    setIsVisible(false);
    try {
      localStorage.setItem('niyamah_marketing_tour_dismissed', 'true');
    } catch {
      // ignore
    }
  }

  if (!isVisible) return null;

  // 1. Compact Welcome Card (Exposes KPIs and content quickly in first viewport)
  if (!isExpanded) {
    return (
      <aside className="admin-guided-tour-card admin-guided-tour-compact" aria-label="Welcome to Marketing">
        <div className="admin-guided-tour-header" style={{ marginBottom: '6px' }}>
          <div className="admin-guided-tour-title-area">
            <span className="admin-guided-tour-badge">Welcome to Marketing 👋</span>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              Get the most from your store data
            </h3>
          </div>
          <button
            type="button"
            className="admin-guided-tour-close"
            onClick={handleDismiss}
            aria-label="Dismiss tour"
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.72)', margin: '0 0 6px 0' }}>
          A short guide can show you:
        </p>
        <ul style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.72)', margin: '0 0 10px 18px', padding: 0 }}>
          <li>How sales are performing</li>
          <li>Where customers leave</li>
          <li>Where to get help</li>
        </ul>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-button"
            onClick={() => setIsExpanded(true)}
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
          >
            Start 2-minute tour →
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={handleDismiss}
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
          >
            Maybe later
          </button>
        </div>
      </aside>
    );
  }

  // 2. Expanded 3-Step Tour (Triggered only on user request)
  return (
    <aside className="admin-guided-tour-card" aria-label="Welcome to Marketing Guide">
      <div className="admin-guided-tour-header">
        <div className="admin-guided-tour-title-area">
          <span className="admin-guided-tour-badge">Quick Tour ({step}/3)</span>
          <h3>Understand your online sales in 3 simple steps</h3>
        </div>
        <button
          type="button"
          className="admin-guided-tour-close"
          onClick={handleDismiss}
          aria-label="Dismiss tour"
        >
          ✕
        </button>
      </div>

      <div className="admin-guided-tour-steps">
        <div className={`admin-tour-step ${step === 1 ? 'is-active' : ''}`}>
          <div className="admin-tour-step-num">1</div>
          <div className="admin-tour-step-body">
            <strong>Check your Revenue & ROAS</strong>
            <p>
              Compare ad spend with attributed revenue. Remember: ROAS measures ad revenue efficiency before product, delivery, returns, and operating costs.
            </p>
          </div>
        </div>

        <div className={`admin-tour-step ${step === 2 ? 'is-active' : ''}`}>
          <div className="admin-tour-step-num">2</div>
          <div className="admin-tour-step-body">
            <strong>Spot where visitors leave</strong>
            <p>
              Open the <strong>Sales Journey</strong> tab to see how many people visited vs started ordering.
            </p>
          </div>
        </div>

        <div className={`admin-tour-step ${step === 3 ? 'is-active' : ''}`}>
          <div className="admin-tour-step-num">3</div>
          <div className="admin-tour-step-body">
            <strong>Need help? Click "Explain this page"</strong>
            <p>
              Every page has an explanation button in the top corner to guide you through what the numbers mean.
            </p>
          </div>
        </div>
      </div>

      <div className="admin-guided-tour-footer">
        <div style={{ display: 'flex', gap: '8px' }}>
          {step > 1 && (
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setStep(step - 1)}
              style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
            >
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className="admin-button"
              onClick={() => setStep(step + 1)}
              style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            >
              Next step →
            </button>
          ) : (
            <button
              type="button"
              className="admin-button"
              onClick={handleDismiss}
              style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            >
              Got it, let's go! →
            </button>
          )}
        </div>
        <Link
          href="/admin/marketing/help"
          className="admin-secondary-button"
          onClick={handleDismiss}
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          📖 Open Full Tutorial Hub
        </Link>
      </div>
    </aside>
  );
}
