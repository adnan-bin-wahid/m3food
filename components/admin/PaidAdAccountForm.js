'use client';

import { useActionState } from 'react';
import { createPaidAdAccountAction } from '../../app/admin/marketing/ads/actions';

const initialState = { ok: false, message: '' };

export default function PaidAdAccountForm({ editable }) {
  const [state, action, pending] = useActionState(createPaidAdAccountAction, initialState);

  return (
    <form action={action} className="admin-settings-form">
      <fieldset disabled={!editable || pending}>
        <label>
          Provider
          <select name="provider" defaultValue="META">
            <option value="META">Meta</option>
            <option value="GOOGLE">Google</option>
          </select>
        </label>
        <label>
          External account ID
          <input name="externalAccountId" required maxLength="160" placeholder="act_123456789" spellCheck={false} />
        </label>
        <label>
          Account name
          <input name="name" required maxLength="160" placeholder="Main performance account" />
        </label>
        <label>
          Billing currency
          <input name="currency" required maxLength="3" defaultValue="BDT" spellCheck={false} />
          <small>Stored exactly as the provider account currency. Cross-currency ROAS will not be guessed.</small>
        </label>
        <label>
          Account timezone
          <input name="timezone" required maxLength="64" defaultValue="Asia/Dhaka" spellCheck={false} />
        </label>
        {editable ? <button className="admin-button" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Register ad account'}</button> : null}
      </fieldset>
      {!editable ? <p className="admin-note">Your role has read-only access.</p> : null}
      {state.message ? <p className={state.ok ? 'admin-success' : 'admin-error'} role="status">{state.message}</p> : null}
    </form>
  );
}
