import Link from 'next/link';
import AdminShell from '../../../../components/admin/AdminShell';
import MarketingNav from '../../../../components/admin/MarketingNav';
import ClaritySessionRowAction from '../../../../components/admin/ClaritySessionRowAction';
import { requireCurrentAdmin } from '../../../../src/lib/auth/current-admin';
import { getDatabase } from '../../../../src/lib/db';
import { stores, visitorSessions, visitors } from '../../../../src/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

function date(value, timezone) {
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(value instanceof Date ? value : new Date(value));
}

function mask(value) {
  return value.length > 22 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
}

export const dynamic = 'force-dynamic';

export default async function ClarityHubPage({ searchParams }) {
  const admin = await requireCurrentAdmin();
  const raw = await searchParams;
  const range = raw?.range || '30d';
  const db = getDatabase();

  const [store] = await db
    .select({
      name: stores.name,
      slug: stores.slug,
      clarityProjectId: stores.clarityProjectId,
      timezone: stores.timezone,
    })
    .from(stores)
    .where(eq(stores.id, admin.storeId))
    .limit(1);

  const clarityId = store?.clarityProjectId || '';
  const hasClarity = Boolean(clarityId);

  // Fetch recent visitor sessions
  const recentSessions = await db
    .select({
      sessionId: visitorSessions.id,
      sessionKey: visitorSessions.sessionKey,
      visitorKey: visitors.visitorKey,
      utmSource: visitorSessions.utmSource,
      utmCampaign: visitorSessions.utmCampaign,
      fbclid: visitorSessions.fbclid,
      landingPage: visitorSessions.landingPage,
      startedAt: visitorSessions.startedAt,
    })
    .from(visitorSessions)
    .innerJoin(visitors, eq(visitors.id, visitorSessions.visitorId))
    .where(eq(visitorSessions.storeId, admin.storeId))
    .orderBy(desc(visitorSessions.startedAt))
    .limit(20);

  const recordingsUrl = hasClarity ? `https://clarity.microsoft.com/projects/view/${clarityId}/recordings` : '#';
  const heatmapsUrl = hasClarity ? `https://clarity.microsoft.com/projects/view/${clarityId}/heatmaps` : '#';
  const dashboardUrl = hasClarity ? `https://clarity.microsoft.com/projects/view/${clarityId}/dashboard` : '#';
  const settingsUrl = hasClarity ? `https://clarity.microsoft.com/projects/view/${clarityId}/settings` : '#';

  return (
    <AdminShell admin={admin}>
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">{store?.name} · Visual Replay & Heatmaps</p>
          <h1>Microsoft Clarity Hub</h1>
          <p className="admin-muted admin-header-copy">
            ভিজিটরদের লাইভ ভিডিও রেকর্ডিং, ক্লিক হিটম্যাপ এবং স্ক্রল অ্যানালিটিক্স সরাসরি ১-ক্লিকে মনিটর করুন।
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            background: hasClarity ? '#e6f7ec' : '#fde8e8',
            color: hasClarity ? '#147d3b' : '#c5221f',
            border: `1px solid ${hasClarity ? '#a3e6ba' : '#f8b4b4'}`
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasClarity ? '#147d3b' : '#c5221f' }} />
            {hasClarity ? `Active: ${clarityId}` : 'Not configured'}
          </span>
        </div>
      </header>

      <MarketingNav current="/admin/marketing/clarity" range={range} />

      {/* Primary Action Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
        {/* Card 1: Recordings */}
        <article className="admin-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎥</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px', color: '#17251b' }}>Session Recordings (ভিডিও রিপ্লে)</h2>
            <p style={{ fontSize: '13px', color: '#5e6c61', lineHeight: '1.6', margin: '0 0 20px' }}>
              কাস্টমারদের আসল স্ক্রিন রেকর্ডিং ভিডিও প্লেয়ার। কাস্টমার কোথায় টাচ করেছে, কীভাবে স্ক্রল করেছে এবং ড্রপ করেছে তা সরাসরি দেখুন।
            </p>
          </div>
          <a
            href={recordingsUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-button"
            style={{
              background: '#0078d4',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '9px',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Open Live Recordings</span>
            <span>↗</span>
          </a>
        </article>

        {/* Card 2: Heatmaps */}
        <article className="admin-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔥</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px', color: '#17251b' }}>Click & Scroll Heatmaps (হিটম্যাপ)</h2>
            <p style={{ fontSize: '13px', color: '#5e6c61', lineHeight: '1.6', margin: '0 0 20px' }}>
              ল্যান্ডিং পেজের কোন কোন বাটনে সবচেয়ে বেশি ক্লিক পড়ছে এবং ভিজিটররা পেজের কতদূর নামছে তার কালার কোডেড ভিজ্যুয়াল হিটম্যাপ।
            </p>
          </div>
          <a
            href={heatmapsUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-button"
            style={{
              background: '#d83b01',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '9px',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Open Heatmaps</span>
            <span>↗</span>
          </a>
        </article>

        {/* Card 3: Dashboard Insights */}
        <article className="admin-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px', color: '#17251b' }}>Frustration Insights (ইউজার ইনসাইটস)</h2>
            <p style={{ fontSize: '13px', color: '#5e6c61', lineHeight: '1.6', margin: '0 0 20px' }}>
              Dead Clicks (অকেজো ক্লিক), Rage Clicks (বারবার ক্লিক), Excessive Scrolling এবং Quick Backs ইনসাইটস একনজরে দেখুন।
            </p>
          </div>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-button"
            style={{
              background: '#107c41',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '9px',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Open Clarity Insights</span>
            <span>↗</span>
          </a>
        </article>
      </section>

      {/* Filter Info Banner */}
      <section className="admin-panel" style={{ marginTop: '24px', padding: '20px 24px', background: '#fdfbf7', border: '1px solid #ebdcc5' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '800', color: '#684512' }}>
          💡 কীভাবে অ্যাডমিন প্যানেল থেকে Clarity-তে স্পেসিফিক ইউজার খুঁজবেন?
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#7a5a29', lineHeight: '1.6' }}>
          আমাদের সিস্টেম প্রতিটি ভিজিটরের সাথে স্বয়ংক্রিয়ভাবে দুটি কাস্টম ট্যাগ পাঠায়: <strong>effy_session</strong> (সেশন কী) এবং <strong>effy_visitor</strong> (ভিজিটর কী)।
          Clarity ড্যাশবোর্ডে গিয়ে <em>Filters &gt; Custom tags</em> এ ক্লিক করে নিচের যেকোনো সেশন আইডি পেস্ট করলে হুবহু ওই ইউজারের স্ক্রিন রেকর্ডিং চলে আসবে।
        </p>
      </section>

      {/* Recent Sessions Table with direct 1-click links */}
      <section className="admin-panel" style={{ marginTop: '24px' }}>
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Direct Session Replays</p>
            <h2>সাম্প্রতিক ভিজিটর সেশনসমূহ ({recentSessions.length})</h2>
          </div>
          <a href={recordingsUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#285c32', fontWeight: '700', textDecoration: 'none' }}>
            View all in Clarity ↗
          </a>
        </div>

        {recentSessions.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Source</th>
                  <th>Campaign</th>
                  <th>Started At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => {
                  const source = s.fbclid ? 'meta' : s.utmSource || 'direct';
                  return (
                    <tr key={s.sessionKey}>
                      <td className="admin-stacked-cell">
                        <Link href={`/admin/marketing/visitors/${encodeURIComponent(s.sessionKey)}`} style={{ fontWeight: '700', color: '#285c32' }}>
                          {mask(s.sessionKey)}
                        </Link>
                        <small>{mask(s.visitorKey)}</small>
                      </td>
                      <td>
                        <span className="admin-count-badge">{source}</span>
                      </td>
                      <td>{s.utmCampaign || '—'}</td>
                      <td>{date(s.startedAt, store?.timezone || 'Asia/Dhaka')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <ClaritySessionRowAction sessionKey={s.sessionKey} clarityId={clarityId} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">এখনো কোনো নতুন সেশন রেকর্ড হয়নি। অ্যাড বা ট্রাফিক শুরু হলে এখানে সেশনগুলো লাইভ চলে আসবে।</p>
        )}
      </section>
    </AdminShell>
  );
}
