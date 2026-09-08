'use client';

import { useActionState } from 'react';
import { updateOrderPaymentStatusAction } from '../../app/admin/orders/actions';

const initialState = { ok: false, message: '' };

function label(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function OrderPaymentStatusForm({
  publicId,
  expectedRevision,
  currentStatus,
  allowedTransitions,
  providerReference,
  editable,
}) {
  const [state, action, pending] = useActionState(
    updateOrderPaymentStatusAction,
    initialState,
  );

  if (!allowedTransitions.length) {
    return (
      <div className="admin-catalog-form">
        <p className="admin-note">
          {currentStatus === 'REFUNDED'
            ? 'Refunded payment is terminal.'
            : 'No payment transition is currently available.'}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="admin-catalog-form">
      <input type="hidden" name="publicId" value={publicId} />
      <input
        type="hidden"
        name="expectedRevision"
        value={expectedRevision}
      />

      <fieldset disabled={!editable || pending}>
        <label>
          Reconcile payment status
          <select name="toStatus" defaultValue={allowedTransitions[0]}>
            {allowedTransitions.map((status) => (
              <option key={status} value={status}>
                {label(status)}
              </option>
            ))}
          </select>
          <small>
            Current: {label(currentStatus)}. Status changes are revision
            guarded and written to immutable audit history.
          </small>
        </label>

        <label>
          Payment / collection reference
          <input
            name="providerReference"
            defaultValue={providerReference || ''}
            maxLength={255}
            placeholder="Optional COD receipt or provider reference"
          />
        </label>

        <label>
          Reconciliation note
          <textarea
            name="note"
            rows={3}
            maxLength={500}
            placeholder="Optional reason or settlement note"
          />
        </label>

        {editable ? (
          <button
            className="admin-secondary-button"
            type="submit"
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Update payment status'}
          </button>
        ) : null}
      </fieldset>

      {!editable ? (
        <p className="admin-note">
          Your role has read-only access to payment settlement.
        </p>
      ) : null}

      {state.message ? (
        <p
          className={state.ok ? 'admin-success' : 'admin-error'}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
