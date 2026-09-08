'use client';

import { useActionState } from 'react';
import { syncPaidAdsAccountAction } from '../../app/admin/marketing/ads/actions';

const initialState = { ok: false, message: '' };

export default function PaidAdSyncForm({ editable, accounts }) {
  const [state, action, pending] = useActionState(
    syncPaidAdsAccountAction,
    initialState,
  );

  const ready = accounts.length > 0;

  return (
    <form action={action} className="admin-settings-form">
      <fieldset disabled={!editable || !ready || pending}>
        <label>
          Ad account
          <select name="accountId" required defaultValue="">
            <option value="" disabled>Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.provider} · {account.name} · {account.currency}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start date
          <input name="startDate" type="date" required />
        </label>

        <label>
          End date
          <input name="endDate" type="date" required />
          <small>One on-demand sync can cover at most 31 calendar days.</small>
        </label>

        {editable && ready ? (
          <button
            className="admin-button"
            type="submit"
            disabled={pending}
          >
            {pending ? 'Syncing…' : 'Sync provider delivery'}
          </button>
        ) : null}
      </fieldset>

      {!ready ? (
        <p className="admin-note">
          Register an ad account before running provider sync.
        </p>
      ) : null}

      {!editable ? (
        <p className="admin-note">
          Your role has read-only access.
        </p>
      ) : null}

      {state.message ? (
        <p
          className={state.ok ? 'admin-success' : 'admin-error'}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
