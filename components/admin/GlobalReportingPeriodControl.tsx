'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ADMIN_PRESET_OPTIONS,
  DEFAULT_ADMIN_REPORTING_PERIOD,
  parseAdminReportingPeriod,
  resolveAdminReportingWindow,
  buildReportingPeriodUrl,
  type AdminReportingPeriod,
} from '../../src/lib/admin/reporting-period';

interface GlobalReportingPeriodControlProps {
  variant?: 'desktop' | 'mobile';
}

function shouldShowReportingControl(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.startsWith('/admin/settings')) return false;
  if (pathname.startsWith('/admin/catalog')) return false;
  if (pathname.startsWith('/admin/customers')) return false;
  if (pathname.startsWith('/admin/payments')) return false;
  return true;
}

function ReportingPeriodControlContent({ variant = 'desktop' }: GlobalReportingPeriodControlProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPeriod = parseAdminReportingPeriod(searchParams);
  const currentFrom = searchParams?.get('from') || '';
  const currentTo = searchParams?.get('to') || '';

  const window = resolveAdminReportingWindow(
    currentPeriod,
    new Date(),
    currentFrom,
    currentTo,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(currentPeriod === 'custom');
  const [fromInput, setFromInput] = useState(window.from || '');
  const [toInput, setToInput] = useState(window.to || '');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state when query parameters change
  useEffect(() => {
    setIsCustomMode(currentPeriod === 'custom');
    if (window.from) setFromInput(window.from);
    if (window.to) setToInput(window.to);
  }, [currentPeriod, currentFrom, currentTo, window.from, window.to]);

  // Handle outside click and escape key to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeLabel = window.label;
  const mobileLabel =
    currentPeriod === '30d'
      ? '30d'
      : currentPeriod === '7d'
        ? '7d'
        : currentPeriod === '90d'
          ? '90d'
          : activeLabel;

  function handlePresetSelect(preset: AdminReportingPeriod) {
    if (preset === 'custom') {
      setIsCustomMode(true);
      return;
    }
    setIsCustomMode(false);
    setIsOpen(false);
    const targetUrl = buildReportingPeriodUrl(pathname, searchParams, preset);
    router.push(targetUrl);
  }

  function handleCustomApply(e: React.FormEvent) {
    e.preventDefault();
    if (!fromInput || !toInput) return;
    const targetUrl = buildReportingPeriodUrl(
      pathname,
      searchParams,
      'custom',
      fromInput,
      toInput,
    );
    setIsOpen(false);
    router.push(targetUrl);
  }

  if (variant === 'mobile') {
    return (
      <div className="admin-mobile-period-container" ref={popoverRef}>
        <button
          type="button"
          className="admin-mobile-period-btn"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`Reporting period: ${activeLabel}. Tap to change.`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="admin-mobile-period-badge">Period</span>
          <span className="admin-mobile-period-text">{mobileLabel}</span>
          <svg
            className={`admin-period-chevron ${isOpen ? 'is-rotated' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div className="admin-period-popover admin-period-popover-mobile" role="dialog" aria-modal="true" aria-label="Select reporting period">
            <div className="admin-period-popover-header">
              <span className="admin-period-popover-title">Global Reporting Period</span>
              <button
                type="button"
                className="admin-period-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close reporting period menu"
              >
                ✕
              </button>
            </div>

            <div className="admin-period-presets-grid">
              {ADMIN_PRESET_OPTIONS.map((opt) => {
                const isActive = opt.key === 'custom' ? isCustomMode : currentPeriod === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={`admin-period-preset-chip ${isActive ? 'is-active' : ''}`}
                    onClick={() => handlePresetSelect(opt.key)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {isCustomMode && (
              <form onSubmit={handleCustomApply} className="admin-period-custom-form">
                <div className="admin-period-date-row">
                  <label className="admin-period-field">
                    <span>From:</span>
                    <input
                      type="date"
                      value={fromInput}
                      onChange={(e) => setFromInput(e.target.value)}
                      required
                      className="admin-period-input"
                    />
                  </label>
                  <label className="admin-period-field">
                    <span>To:</span>
                    <input
                      type="date"
                      value={toInput}
                      onChange={(e) => setToInput(e.target.value)}
                      required
                      className="admin-period-input"
                    />
                  </label>
                </div>
                <div className="admin-period-custom-actions">
                  <button type="submit" className="admin-period-apply-btn">
                    Apply custom range
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="admin-global-period-container" ref={popoverRef} role="region" aria-label="Global reporting period">
      <div className="admin-period-control-wrapper">
        <span className="admin-period-header-label">Reporting period</span>
        <button
          type="button"
          className="admin-period-trigger-btn"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`Reporting period: ${activeLabel}. Click to change.`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="admin-period-calendar-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <span className="admin-period-trigger-text">{activeLabel}</span>
          <svg
            className={`admin-period-chevron ${isOpen ? 'is-rotated' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="admin-period-popover" role="dialog" aria-modal="true" aria-label="Select reporting period">
          <div className="admin-period-popover-header">
            <span className="admin-period-popover-title">Select business reporting period</span>
            <small className="admin-period-popover-tz">Asia/Dhaka (UTC+6)</small>
          </div>

          <div className="admin-period-presets-grid">
            {ADMIN_PRESET_OPTIONS.map((opt) => {
              const isActive = opt.key === 'custom' ? isCustomMode : currentPeriod === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`admin-period-preset-chip ${isActive ? 'is-active' : ''}`}
                  onClick={() => handlePresetSelect(opt.key)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {isCustomMode && (
            <form onSubmit={handleCustomApply} className="admin-period-custom-form">
              <div className="admin-period-date-row">
                <label className="admin-period-field">
                  <span>From:</span>
                  <input
                    type="date"
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    required
                    className="admin-period-input"
                  />
                </label>
                <label className="admin-period-field">
                  <span>To:</span>
                  <input
                    type="date"
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    required
                    className="admin-period-input"
                  />
                </label>
              </div>
              <div className="admin-period-custom-actions">
                <button type="submit" className="admin-period-apply-btn">
                  Apply custom range
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function ReportingPeriodControlVisibilityWrapper(props: GlobalReportingPeriodControlProps) {
  const pathname = usePathname();
  if (!shouldShowReportingControl(pathname)) {
    return null;
  }
  return <ReportingPeriodControlContent {...props} />;
}

export default function GlobalReportingPeriodControl(props: GlobalReportingPeriodControlProps) {
  return (
    <Suspense fallback={<div className="admin-period-skeleton" />}>
      <ReportingPeriodControlVisibilityWrapper {...props} />
    </Suspense>
  );
}
