'use client';

import { useActionState } from 'react';
import { createPaidAdMappingAction } from '../../app/admin/marketing/ads/actions';

const initialState = { ok: false, message: '' };

export default function PaidAdMappingForm({ editable, accounts, campaigns }) {
  const [state, action, pending] = useActionState(createPaidAdMappingAction, initialState);
  const ready = accounts.length > 0 && campaigns.length > 0;

  return (
    <form action={action} className="admin-settings-form">
      <fieldset disabled={!editable || !ready || pending}>
        <label>
          Ad account
          <select name="accountId" required defaultValue="">
            <option value="" disabled>Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.provider} · {account.name} · {account.currency}</option>
            ))}
          </select>
        </label>
        <label>
          Campaign Registry record
          <select name="marketingCampaignId" required defaultValue="">
            <option value="" disabled>Select canonical campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.campaignKey}</option>
            ))}
          </select>
        </label>
        <label>
          Provider campaign ID
          <input name="externalCampaignId" required maxLength="160" placeholder="120210000000000001" spellCheck={false} />
        </label>
        <label>
          Provider campaign name
          <input name="externalCampaignName" required maxLength="255" placeholder="Eid Sale · Broad · CBO" />
        </label>
        {editable && ready ? <button className="admin-button" type="submit" disabled={pending}>{pending ? 'Mapping…' : 'Map campaign'}</button> : null}
      </fieldset>
      {!ready ? <p className="admin-note">Register an ad account and at least one canonical Campaign Registry record first.</p> : null}
      {!editable ? <p className="admin-note">Your role has read-only access.</p> : null}
      {state.message ? <p className={state.ok ? 'admin-success' : 'admin-error'} role="status">{state.message}</p> : null}
    </form>
  );
}
