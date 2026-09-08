'use client';

import { useActionState } from 'react';
import { updatePaidAdScheduleAction } from '../../app/admin/marketing/ads/actions';

const initialState = { ok: false, message: '' };

export default function PaidAdScheduleForm({ editable, account }) {
  const [state, action, pending] = useActionState(
    updatePaidAdScheduleAction,
    initialState,
  );

  return (
    <form action={action} className="admin-settings-form">
      <input type="hidden" name="accountId" value={account.id} />
      <input type="hidden" name="revision" value={account.revision} />

      <fieldset disabled={!editable || !account.isActive || pending}>
        <label>
          <span>Scheduled sync</span>
          <input
            type="checkbox"
            name="syncEnabled"
            defaultChecked={account.syncEnabled}
          />
        </label>

        <label>
          Lookback days
          <input
            type="number"
            name="syncLookbackDays"
            min="1"
            max="31"
            step="1"
            defaultValue={account.syncLookbackDays}
            required
          />
          <small>
            Each daily run ends on the previous provider-local date.
          </small>
        </label>

        {editable && account.isActive ? (
          <button className="admin-button" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save schedule'}
          </button>
        ) : null}
      </fieldset>

      {!account.isActive ? (
        <p className="admin-note">
          Inactive ad accounts cannot be scheduled.
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
