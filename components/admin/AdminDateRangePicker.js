import Link from 'next/link';

const PRESET_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: 'all', label: 'All time' },
];

export default function AdminDateRangePicker({
  baseUrl,
  currentRange,
  range,
  from = '',
  to = '',
  extraParams = {},
}) {
  const activeRange = currentRange || range || '30d';

  function buildPresetHref(optionKey) {
    const params = new URLSearchParams();
    params.set('range', optionKey);
    for (const [k, v] of Object.entries(extraParams)) {
      if (v !== undefined && v !== null && k !== 'range' && k !== 'from' && k !== 'to') {
        params.set(k, String(v));
      }
    }
    return `${baseUrl}?${params.toString()}`;
  }

  const isCustomActive = activeRange === 'custom';
  const activePreset = PRESET_OPTIONS.find((opt) => opt.key === activeRange);
  const activeLabel = isCustomActive ? 'Custom' : (activePreset?.label || '30 days');

  return (
    <div className="admin-date-picker-container" aria-label="Date range selector">
      {/* Desktop Presets Row */}
      <nav className="admin-range-picker admin-range-picker-desktop" aria-label="Date range presets">
        {PRESET_OPTIONS.map((opt) => (
          <Link
            key={opt.key}
            href={buildPresetHref(opt.key)}
            aria-current={!isCustomActive && activeRange === opt.key ? 'page' : undefined}
          >
            {opt.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Compact Range Selector (No clipping, easy tap) */}
      <div className="admin-range-picker-mobile">
        <details className="admin-range-dropdown">
          <summary className="admin-range-dropdown-btn">
            <span className="admin-range-dropdown-label">Date range:</span>
            <strong>{activeLabel} ▾</strong>
          </summary>
          <div className="admin-range-dropdown-menu">
            {PRESET_OPTIONS.map((opt) => (
              <Link
                key={opt.key}
                href={buildPresetHref(opt.key)}
                className={`admin-range-dropdown-item ${!isCustomActive && activeRange === opt.key ? 'is-active' : ''}`}
              >
                {opt.label}
              </Link>
            ))}
            <Link
              href={`${baseUrl}?range=custom`}
              className={`admin-range-dropdown-item ${isCustomActive ? 'is-active' : ''}`}
            >
              Custom
            </Link>
          </div>
        </details>
      </div>

      <form action={baseUrl} method="GET" className="admin-custom-range-form">
        <input type="hidden" name="range" value="custom" />
        {Object.entries(extraParams).map(([k, v]) => {
          if (v === undefined || v === null || k === 'range' || k === 'from' || k === 'to') return null;
          return <input key={k} type="hidden" name={k} value={String(v)} />;
        })}

        <div className="admin-custom-range-inputs">
          <label className="admin-date-field">
            <span className="admin-date-label">From:</span>
            <input
              type="date"
              name="from"
              defaultValue={from || ''}
              required
              className="admin-date-input"
            />
          </label>

          <label className="admin-date-field">
            <span className="admin-date-label">To:</span>
            <input
              type="date"
              name="to"
              defaultValue={to || from || ''}
              required
              className="admin-date-input"
            />
          </label>

          <button type="submit" className="admin-date-submit-btn">
            Filter
          </button>

          {isCustomActive ? (
            <Link href={baseUrl} className="admin-date-clear-btn" title="Clear filter">
              ✕ Reset
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}
