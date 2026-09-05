'use client';

import { useActionState } from 'react';
import { updateOrderStatusAction } from '../../app/admin/orders/actions';

const initialState = { ok: false, message: '' };

function label(status) {
  return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
}

export default function OrderStatusForm({ publicId, currentStatus, transitions }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, initialState);

  return (
    <form className="admin-status-form" action={action}>
      <input type="hidden" name="publicId" value={publicId} />
      <input type="hidden" name="expectedStatus" value={currentStatus} />
      <label>
        Next status
        <select name="toStatus" defaultValue={transitions[0]} required>
          {transitions.map((status) => (
            <option key={status} value={status}>{label(status)}</option>
          ))}
        </select>
      </label>
      <label>
        Internal note <small>Optional, maximum 500 characters</small>
        <textarea name="note" maxLength={500} rows={3} placeholder="Reason or operational note" />
      </label>
      {state.message ? (
        <p className={state.ok ? 'admin-success' : 'admin-error'} role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}
      <button className="admin-button" type="submit" disabled={pending}>
        {pending ? 'Updating…' : 'Update status'}
      </button>
    </form>
  );
}
