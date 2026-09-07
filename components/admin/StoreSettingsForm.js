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
        <label>
          GA4 Measurement ID <span className="admin-optional">Optional</span>
          <input
            name="ga4MeasurementId"
            defaultValue={settings.ga4MeasurementId}
            pattern="G-[A-Z0-9]{4,30}"
            maxLength={32}
            placeholder="G-XXXXXXXXXX"
            spellCheck={false}
          />
          <small>Loads Google Analytics only after explicit analytics consent.</small>
        </label>
        <label>
          Google Tag Manager ID <span className="admin-optional">Optional</span>
          <input
            name="gtmContainerId"
            defaultValue={settings.gtmContainerId}
            pattern="GTM-[A-Z0-9]{4,28}"
            maxLength={32}
            placeholder="GTM-XXXXXXX"
            spellCheck={false}
          />
          <small>Loads the GTM container after consent and pushes normalized commerce events to dataLayer.</small>
        </label>
        <label>
          Microsoft Clarity Project ID <span className="admin-optional">Optional</span>
          <input
            name="clarityProjectId"
            defaultValue={settings.clarityProjectId}
            pattern="[A-Za-z0-9_-]{5,64}"
            maxLength={64}
            placeholder="abc123xyz"
            spellCheck={false}
          />
          <small>Loads Microsoft Clarity only after explicit analytics consent and correlates recordings with Effy visitor/session IDs.</small>
        </label>
        <p className="admin-note">
          Meta Conversions API uses the Pixel ID above plus server-only META_CAPI_ACCESS_TOKEN and META_GRAPH_API_VERSION environment variables. Clarity uses only its public project ID; no Clarity secret is stored here.
        </p>
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
