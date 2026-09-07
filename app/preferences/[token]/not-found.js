import Link from 'next/link';

export default function PreferenceNotFound() {
  return (
    <main className="preference-page">
      <section className="preference-card">
        <h1>Preference link unavailable</h1>
        <p>This link is invalid or the customer record is no longer available.</p>
        <Link href="/">Return to the store</Link>
      </section>
    </main>
  );
}
