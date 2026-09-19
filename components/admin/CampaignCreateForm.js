'use client';

import { useActionState, useState } from 'react';
import { createCampaignAction } from '../../app/admin/marketing/campaigns/actions';

const initialState = { ok: false, message: '' };

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CampaignCreateForm({ editable }) {
  const [state, action, pending] = useActionState(createCampaignAction, initialState);

  // Wizard state
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('facebook');
  const [adName, setAdName] = useState('');
  const [audience, setAudience] = useState('');
  const [landingUrl, setLandingUrl] = useState('');

  // Auto-derived values
  const derivedKey = slugify(name);
  const derivedSource = channel === 'facebook' ? 'facebook' : channel === 'google' ? 'google' : channel === 'tiktok' ? 'tiktok' : 'other';
  const derivedMedium = channel === 'google' ? 'cpc' : channel === 'facebook' || channel === 'tiktok' ? 'paid-social' : 'referral';
  const derivedContent = slugify(adName);
  const derivedTerm = slugify(audience);

  // Advanced toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customMedium, setCustomMedium] = useState('');

  return (
    <form action={action} className="admin-settings-form">
      <fieldset disabled={!editable || pending} style={{ border: 'none', padding: 0, margin: 0 }}>
        {/* Wizard Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Step 1 */}
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--admin-forest)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                1
              </span>
              <label htmlFor="campaign-name-input" style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
                Campaign Name
              </label>
            </div>
            <input
              id="campaign-name-input"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength="160"
              placeholder="e.g. Eid Sale 2026, Summer Clearance"
              style={{ width: '100%' }}
            />
            <small style={{ color: 'var(--admin-muted)', display: 'block', marginTop: '4px' }}>
              A friendly name to identify this campaign in your reports.
            </small>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--admin-forest)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                2
              </span>
              <label htmlFor="campaign-channel-select" style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
                Where will you advertise?
              </label>
            </div>
            <select
              id="campaign-channel-select"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="facebook">Facebook / Instagram Ads (paid-social)</option>
              <option value="google">Google Search / Display (cpc)</option>
              <option value="tiktok">TikTok Ads (paid-social)</option>
              <option value="other">Other / Influencer / Referral</option>
            </select>
            <small style={{ color: 'var(--admin-muted)', display: 'block', marginTop: '4px' }}>
              The platform where this ad will run.
            </small>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--admin-forest)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                3
              </span>
              <label htmlFor="campaign-ad-input" style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
                Which ad creative? <span className="admin-optional">Optional</span>
              </label>
            </div>
            <input
              id="campaign-ad-input"
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
              maxLength="160"
              placeholder="e.g. Video 01, Image Carousel, Discount Banner"
              style={{ width: '100%' }}
            />
            <small style={{ color: 'var(--admin-muted)', display: 'block', marginTop: '4px' }}>
              Helps compare which specific video or photo drives the most sales.
            </small>
          </div>

          {/* Step 4 */}
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--admin-forest)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                4
              </span>
              <label htmlFor="campaign-audience-input" style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
                Target audience <span className="admin-optional">Optional</span>
              </label>
            </div>
            <input
              id="campaign-audience-input"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              maxLength="160"
              placeholder="e.g. Women 25-34 Dhaka, Broad Bangladesh"
              style={{ width: '100%' }}
            />
            <small style={{ color: 'var(--admin-muted)', display: 'block', marginTop: '4px' }}>
              The demographic or audience group you are targeting.
            </small>
          </div>

          {/* Step 5 */}
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--admin-forest)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                5
              </span>
              <label htmlFor="campaign-landing-input" style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
                Landing page URL <span className="admin-optional">Optional</span>
              </label>
            </div>
            <input
              id="campaign-landing-input"
              name="landingUrl"
              type="url"
              value={landingUrl}
              onChange={(e) => setLandingUrl(e.target.value)}
              maxLength="2048"
              placeholder="https://example.com/offer"
              style={{ width: '100%' }}
            />
            <small style={{ color: 'var(--admin-muted)', display: 'block', marginTop: '4px' }}>
              The page customers should land on when clicking your ad.
            </small>
          </div>
        </div>

        {/* Hidden Form Fields derived from Wizard */}
        <input type="hidden" name="campaignKey" value={customKey || derivedKey} />
        <input type="hidden" name="source" value={customSource || derivedSource} />
        <input type="hidden" name="medium" value={customMedium || derivedMedium} />
        <input type="hidden" name="content" value={derivedContent} />
        <input type="hidden" name="term" value={derivedTerm} />
        <input type="hidden" name="status" value="ACTIVE" />

        {/* Collapsible Advanced UTM Details */}
        <div style={{ marginTop: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--admin-forest)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showAdvanced ? '▼ Hide advanced UTM settings' : '▶ Show advanced UTM settings'}
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--admin-bg)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>
                Custom utm_campaign
                <input
                  value={customKey || derivedKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="eid-sale-2026"
                />
              </label>
              <label>
                Custom utm_source
                <input
                  value={customSource || derivedSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="facebook"
                />
              </label>
              <label>
                Custom utm_medium
                <input
                  value={customMedium || derivedMedium}
                  onChange={(e) => setCustomMedium(e.target.value)}
                  placeholder="paid-social"
                />
              </label>
            </div>
          )}
        </div>

        {editable ? (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <button className="admin-button" type="submit" disabled={pending || !name.trim()}>
              {pending ? 'Creating tracking link…' : 'Create campaign tracking link'}
            </button>
          </div>
        ) : (
          <p className="admin-note" style={{ marginTop: 'var(--space-3)' }}>
            Your role has read-only access.
          </p>
        )}
      </fieldset>

      {state.message ? (
        <p className={state.ok ? 'admin-success' : 'admin-error'} role="status" aria-live="polite" style={{ marginTop: 'var(--space-3)' }}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
