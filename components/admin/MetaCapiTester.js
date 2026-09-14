'use client';

import { useState } from 'react';

export default function MetaCapiTester({ pixelId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/meta-capi/test', {
        method: 'POST',
      });
      const data = await res.json();
      setResult(data?.data || data);
    } catch (err) {
      setResult({
        success: false,
        error: err.message || 'Failed to ping Meta CAPI server endpoint.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-capi-test-card">
      <div className="admin-capi-test-header">
        <div>
          <h3>Live Meta CAPI Diagnostics</h3>
          <p className="admin-muted">
            Send a live test event from the server to Meta Graph API to verify that your CAPI access token is working.
          </p>
        </div>
        <button
          type="button"
          className="admin-button admin-button-primary"
          onClick={handleTest}
          disabled={loading}
        >
          {loading ? 'Testing Meta Connection…' : '⚡ Test Meta CAPI Connection'}
        </button>
      </div>

      {result && (
        <div
          className={`admin-capi-result ${
            result.success ? 'is-success' : 'is-warning'
          }`}
        >
          {result.success ? (
            <div>
              <div className="admin-capi-result-title">
                <span className="admin-status-dot is-active" />
                <strong>Meta Conversions API is LIVE and Connected!</strong>
              </div>
              <p className="admin-muted" style={{ margin: '6px 0 10px' }}>
                Meta Graph API received the test event successfully (Status {result.status || 200}).
              </p>
              <div className="admin-capi-meta-grid">
                <div>
                  <small>Pixel ID</small>
                  <code>{result.pixelId || pixelId}</code>
                </div>
                <div>
                  <small>Graph API Version</small>
                  <code>{result.apiVersion || 'v21.0'}</code>
                </div>
                {result.fbtraceId && (
                  <div>
                    <small>Meta fbtrace_id</small>
                    <code>{result.fbtraceId}</code>
                  </div>
                )}
                <div>
                  <small>Verified At</small>
                  <span>{new Date(result.testedAt || Date.now()).toLocaleTimeString('en-BD')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="admin-capi-result-title">
                <span className="admin-status-dot is-warning" />
                <strong>Connection Test Status</strong>
              </div>
              <p style={{ margin: '6px 0' }}>
                {result.error || result.metaErrorMessage || 'CAPI did not return 200 OK.'}
              </p>
              {result.metaErrorCode && (
                <small className="admin-muted">
                  Meta Error Code: {result.metaErrorCode}
                  {result.metaErrorSubcode ? ` (Subcode: ${result.metaErrorSubcode})` : ''}
                </small>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
