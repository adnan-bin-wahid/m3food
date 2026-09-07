import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarketingPreferenceForm from '../../../components/MarketingPreferenceForm';
import { getMarketingPreferenceSecret } from '../../../src/lib/config/server-env';
import { DrizzleMarketingPreferenceRepository } from '../../../src/lib/db/marketing-preference-repository';
import { getMarketingPreference } from '../../../src/lib/privacy/preferences';

function maskPhone(value) {
  if (!value || value.length < 7) return value || '—';
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

function maskEmail(value) {
  if (!value) return 'Not provided';
  const [name, domain] = value.split('@');
  if (!domain) return 'Provided';
  return `${name.slice(0, 2)}•••@${domain}`;
}

export default async function PreferencePage({ params }) {
  const { token } = await params;
  const preference = await getMarketingPreference(
    token,
    getMarketingPreferenceSecret(),
    new DrizzleMarketingPreferenceRepository(),
  );
  if (!preference) notFound();

  return (
    <main className="preference-page">
      <section className="preference-card">
        <p className="preference-eyebrow">{preference.storeName}</p>
        <h1>Marketing preferences</h1>
        <p>Choose which optional marketing channels you want to receive. You can change these choices at any time using this signed link.</p>
        <div className="preference-identity">
          <span><small>Customer</small>{preference.customerName}</span>
          <span><small>Phone</small>{maskPhone(preference.phone)}</span>
          <span><small>Email</small>{maskEmail(preference.email)}</span>
        </div>
        <MarketingPreferenceForm token={token} preference={preference} />
        <p className="preference-policy"><Link href="/privacy">Read the privacy policy</Link></p>
      </section>
    </main>
  );
}
