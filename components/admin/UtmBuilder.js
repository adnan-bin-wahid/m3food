'use client';

import { useMemo, useState } from 'react';

function makeUrl(baseUrl, campaign, content, term) {
  try {
    const parsed = new URL(baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    parsed.searchParams.set('utm_source', campaign.source);
    parsed.searchParams.set('utm_medium', campaign.medium);
    parsed.searchParams.set('utm_campaign', campaign.campaignKey);

    if (content.trim()) parsed.searchParams.set('utm_content', content.trim());
    else parsed.searchParams.delete('utm_content');

    if (term.trim()) parsed.searchParams.set('utm_term', term.trim());
    else parsed.searchParams.delete('utm_term');

    return parsed.toString();
  } catch {
    return '';
  }
}

export default function UtmBuilder({ campaigns }) {
  const first = campaigns[0] ?? null;
  const [campaignId, setCampaignId] = useState(first?.id ?? '');
  const selected = campaigns.find((campaign) => campaign.id === campaignId) ?? null;
  const [baseUrl, setBaseUrl] = useState(first?.landingUrl ?? '');
  const [content, setContent] = useState(first?.content ?? '');
  const [term, setTerm] = useState(first?.term ?? '');
  const [copied, setCopied] = useState(false);

  const url = useMemo(
    () => (selected ? makeUrl(baseUrl, selected, content, term) : ''),
    [baseUrl, selected, content, term],
  );

  function changeCampaign(event) {
    const nextId = event.target.value;
    const next = campaigns.find((campaign) => campaign.id === nextId) ?? null;
    setCampaignId(nextId);
    setBaseUrl(next?.landingUrl ?? '');
    setContent(next?.content ?? '');
    setTerm(next?.term ?? '');
    setCopied(false);
  }

  async function copyUrl() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!campaigns.length) {
    return <p className="admin-empty">Create a campaign first, then build a tagged landing URL.</p>;
  }

  return (
    <div className="admin-settings-form">
      <label>
        Campaign
        <select value={campaignId} onChange={changeCampaign}>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name} · {campaign.campaignKey}
            </option>
          ))}
        </select>
      </label>

      <label>
        Landing URL
        <input
          type="url"
          value={baseUrl}
          onChange={(event) => { setBaseUrl(event.target.value); setCopied(false); }}
          placeholder="https://example.com/offer"
          spellCheck={false}
        />
      </label>

      <label>
        utm_content <span className="admin-optional">Optional override</span>
        <input
          value={content}
          onChange={(event) => { setContent(event.target.value); setCopied(false); }}
          maxLength={160}
          spellCheck={false}
        />
      </label>

      <label>
        utm_term <span className="admin-optional">Optional override</span>
        <input
          value={term}
          onChange={(event) => { setTerm(event.target.value); setCopied(false); }}
          maxLength={160}
          spellCheck={false}
        />
      </label>

      <label>
        Generated URL
        <textarea value={url} readOnly rows="4" spellCheck={false} placeholder="Enter a valid landing URL." />
      </label>

      <p className="admin-note">
        Source: <strong>{selected?.source}</strong> · Medium: <strong>{selected?.medium}</strong> · Campaign: <strong>{selected?.campaignKey}</strong>
      </p>

      <button className="admin-button" type="button" onClick={copyUrl} disabled={!url}>
        {copied ? 'Copied' : 'Copy tagged URL'}
      </button>
    </div>
  );
}
