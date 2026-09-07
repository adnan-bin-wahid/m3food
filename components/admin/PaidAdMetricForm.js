'use client';

import { useActionState } from 'react';
import { upsertPaidAdMetricAction } from '../../app/admin/marketing/ads/actions';

const initialState = { ok: false, message: '' };

export default function PaidAdMetricForm({ editable, mappings }) {
  const [state, action, pending] = useActionState(upsertPaidAdMetricAction, initialState);
  const ready = mappings.length > 0;

  return (
    <form action={action} className="admin-settings-form">
      <fieldset disabled={!editable || !ready || pending}>
        <label>
          Campaign mapping
          <select name="mappingId" required defaultValue="">
            <option value="" disabled>Select mapping</option>
            {mappings.map((mapping) => (
              <option key={mapping.id} value={mapping.id}>
                {mapping.provider} · {mapping.externalCampaignName} → {mapping.campaignKey || 'Unmapped'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Metric date
          <input name="metricDate" type="date" required />
        </label>
        <label>
          Spend (minor units)
          <input name="spendMinor" type="number" min="0" step="1" required placeholder="125000" />
          <small>Example: BDT 1,250.00 = 125000 minor units.</small>
        </label>
        <label>
          Impressions
          <input name="impressions" type="number" min="0" step="1" required defaultValue="0" />
        </label>
        <label>
          Clicks
          <input name="clicks" type="number" min="0" step="1" required defaultValue="0" />
        </label>
        {editable && ready ? <button className="admin-button" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save daily metrics'}</button> : null}
      </fieldset>
      {!ready ? <p className="admin-note">Create a provider campaign mapping before recording delivery metrics.</p> : null}
      {!editable ? <p className="admin-note">Your role has read-only access.</p> : null}
      {state.message ? <p className={state.ok ? 'admin-success' : 'admin-error'} role="status">{state.message}</p> : null}
    </form>
  );
}
