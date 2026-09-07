'use client';

import { useActionState } from 'react';
import { submitSteadfastShipmentAction } from '../../app/admin/orders/actions';

const initialState = { ok: false, message: '' };

export default function SteadfastShipmentForm({ publicId, retry = false }) {
  const [state, action, pending] = useActionState(submitSteadfastShipmentAction, initialState);
  return (
    <form className="admin-shipment-form" action={action}>
      <input type="hidden" name="publicId" value={publicId} />
      {state.message ? <p className={state.ok ? 'admin-success' : 'admin-error'} role="status">{state.message}</p> : null}
      <button className="admin-button" type="submit" disabled={pending}>
        {pending ? 'Submitting…' : retry ? 'Retry Steadfast submission' : 'Send to Steadfast'}
      </button>
    </form>
  );
}
