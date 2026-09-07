'use client';

import { useActionState } from 'react';
import {
  addCustomerNoteAction,
  addCustomerTagAction,
  removeCustomerTagAction,
} from '../../app/admin/customers/actions';

const initialState = { ok: false, message: '' };

function Feedback({ state }) {
  if (!state.message) return null;
  return <p className={state.ok ? 'admin-success' : 'admin-error'} role="status">{state.message}</p>;
}

export function CustomerTagForm({ customerId }) {
  const [state, action, pending] = useActionState(addCustomerTagAction, initialState);
  return (
    <form action={action} className="admin-customer-inline-form">
      <input type="hidden" name="customerId" value={customerId} />
      <label>
        Add tag
        <input name="tag" required maxLength={40} placeholder="vip, follow-up, wholesale" />
      </label>
      <button className="admin-button" type="submit" disabled={pending}>{pending ? 'Adding…' : 'Add tag'}</button>
      <Feedback state={state} />
    </form>
  );
}

export function CustomerTagRemoveForm({ customerId, tag }) {
  const [state, action, pending] = useActionState(removeCustomerTagAction, initialState);
  return (
    <form action={action} className="admin-tag-remove-form">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="tag" value={tag} />
      <button type="submit" disabled={pending} aria-label={`Remove ${tag} tag`}>×</button>
    </form>
  );
}

export function CustomerNoteForm({ customerId }) {
  const [state, action, pending] = useActionState(addCustomerNoteAction, initialState);
  return (
    <form action={action} className="admin-customer-note-form">
      <input type="hidden" name="customerId" value={customerId} />
      <label>
        Internal note
        <textarea name="note" required maxLength={1000} rows={4} placeholder="Operational context for the team…" />
      </label>
      <small>Append-only. Customers never see these notes.</small>
      <button className="admin-button" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Add note'}</button>
      <Feedback state={state} />
    </form>
  );
}
