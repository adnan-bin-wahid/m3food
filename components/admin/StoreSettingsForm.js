'use client';

import { useActionState } from 'react';
import { saveSettingsAction } from '../../app/admin/settings/actions';

const initialState = { ok: false, message: '' };

export default function StoreSettingsForm({ settings, editable }) {
  const [state, action, pending] = useActionState(saveSettingsAction, initialState);

  return (
    <form action={action} className="admin-settings-form">
      <input type="hidden" name="revision" value={settings.revision} />
      <fieldset disabled={!editable || pending}>
        <label>
          Store name
          <input
            name="name"
            defaultValue={settings.name}
            required
            minLength={1}
            maxLength={160}
            autoComplete="organization"
          />
          <small>Shown in the admin dashboard and public catalog.</small>
        </label>
        <label>
          Timezone
          <input
            name="timezone"
            defaultValue={settings.timezone}
            required
            maxLength={64}
            spellCheck={false}
            placeholder="Asia/Dhaka"
          />
          <small>Use an IANA timezone, for example Asia/Dhaka.</small>
        </label>
        <label>
          Meta Pixel ID <span className="admin-optional">Optional</span>
          <input
            name="metaPixelId"
            defaultValue={settings.metaPixelId}
            inputMode="numeric"
            pattern="[0-9]{5,25}"
            maxLength={25}
            placeholder="123456789012345"
            spellCheck={false}
          />
          <small>
            Leave empty to disable. The Pixel script loads only after explicit analytics consent.
          </small>
        </label>
        {editable ? (
          <button className="admin-button" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save settings'}
          </button>
        ) : null}
      </fieldset>
      {!editable ? <p className="admin-note">Your role has read-only access.</p> : null}
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
