import Link from 'next/link';

export default function EmptyState({
  icon = '📦',
  title = 'No data available',
  message = 'There is no recorded data for this view in the selected date range.',
  suggestion,
  actionLabel,
  actionHref,
}) {
  return (
    <div className="admin-empty-state-card">
      <span className="admin-empty-icon" aria-hidden="true">
        {icon}
      </span>
      <h3 className="admin-empty-title">{title}</h3>
      <p className="admin-empty-message">{message}</p>
      {suggestion && <p className="admin-empty-suggestion">💡 {suggestion}</p>}
      {actionLabel && actionHref && (
        <div className="admin-empty-actions">
          <Link href={actionHref} className="admin-button">
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
