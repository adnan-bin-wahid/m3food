'use client';

import { useActionState } from 'react';
import { updateOrderFulfillmentCostAction } from '../../app/admin/orders/actions';

const initialState = { ok: false, message: '' };

function major(minor) {
  return (minor / 100).toFixed(2);
}

export default function OrderFulfillmentCostForm({
  publicId,
  expectedRevision,
  fulfillmentCostMinor,
  currency,
  editable,
}) {
  const [state, action, pending] = useActionState(
    updateOrderFulfillmentCostAction,
    initialState,
  );

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
          Actual fulfillment cost
          <input
            name="fulfillmentCost"
            defaultValue={
              fulfillmentCostMinor === null
                ? ''
                : major(fulfillmentCostMinor)
            }
            inputMode="decimal"
            pattern="[0-9]+(?:\.[0-9]{1,2})?"
            placeholder="80.00"
          />
          <small>
            {currency} operational cost. Blank means unknown; 0 means
            explicitly zero cost.
          </small>
        </label>

        {editable ? (
          <button
            className="admin-secondary-button"
            type="submit"
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Save fulfillment cost'}
          </button>
        ) : null}
      </fieldset>

      {!editable ? (
        <p className="admin-note">
          Your role has read-only access to order cost data.
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
