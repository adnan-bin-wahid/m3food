'use client';

import { useActionState } from 'react';
import { updateCampaignStatusAction } from '../../app/admin/marketing/campaigns/actions';

const initialState = { ok: false, message: '' };

export default function CampaignStatusForm({ campaign, editable }) {
  const [state, action, pending] = useActionState(updateCampaignStatusAction, initialState);

  if (!editable) return <span>{campaign.status}</span>;

  return (
    <form action={action}>
      <input type="hidden" name="campaignId" value={campaign.id} />
      <input type="hidden" name="expectedRevision" value={campaign.revision} />
      <select name="status" defaultValue={campaign.status} disabled={pending} aria-label={`Status for ${campaign.name}`}>
        <option value="DRAFT">Draft</option>
        <option value="ACTIVE">Active</option>
        <option value="PAUSED">Paused</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <button className="admin-button admin-button-small" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </button>
      {state.message ? <small className={state.ok ? 'admin-success' : 'admin-error'}>{state.message}</small> : null}
    </form>
  );
}
