'use client';

import { useActionState } from 'react';
import { createCampaignAction } from '../../app/admin/marketing/campaigns/actions';

const initialState = { ok: false, message: '' };

export default function CampaignCreateForm({ editable }) {
  const [state, action, pending] = useActionState(createCampaignAction, initialState);

  return (
    <form action={action} className="admin-settings-form">
      <fieldset disabled={!editable || pending}>
        <label>
          Campaign name
          <input name="name" required maxLength="160" placeholder="Eid Sale 2026" />
          <small>Human-readable internal name.</small>
        </label>

        <label>
          Campaign key / utm_campaign
          <input
            name="campaignKey"
            required
            maxLength="120"
            placeholder="eid-sale-2026"
            spellCheck={false}
          />
          <small>Stable analytics identity. Spaces are normalized to lowercase hyphens.</small>
        </label>

        <label>
          UTM source
          <input name="source" required maxLength="120" placeholder="facebook" spellCheck={false} />
        </label>

        <label>
          UTM medium
          <input name="medium" required maxLength="120" placeholder="paid-social" spellCheck={false} />
        </label>

        <label>
          Default utm_content <span className="admin-optional">Optional</span>
          <input name="content" maxLength="160" placeholder="video-01" spellCheck={false} />
        </label>

        <label>
          Default utm_term <span className="admin-optional">Optional</span>
          <input name="term" maxLength="160" placeholder="audience-01" spellCheck={false} />
        </label>

        <label>
          Landing URL <span className="admin-optional">Optional</span>
          <input name="landingUrl" type="url" maxLength="2048" placeholder="https://example.com/offer" spellCheck={false} />
        </label>

        <label>
          Initial status
          <select name="status" defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>

        <label>
          Notes <span className="admin-optional">Optional</span>
          <textarea name="notes" maxLength="2000" rows="3" placeholder="Creative angle, audience, offer or campaign notes." />
        </label>

        {editable ? (
          <button className="admin-button" type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create campaign'}
          </button>
        ) : null}
      </fieldset>

      {!editable ? <p className="admin-note">Your role has read-only access.</p> : null}

      {state.message ? (
        <p className={state.ok ? 'admin-success' : 'admin-error'} role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
