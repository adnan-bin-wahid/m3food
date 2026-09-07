'use client';

import { useActionState } from 'react';
import { updateMarketingPreferenceAction } from '../app/preferences/[token]/actions';

const initialState = { ok: false, message: '' };

export default function MarketingPreferenceForm({ token, preference }) {
  const [state, action, pending] = useActionState(updateMarketingPreferenceAction, initialState);
  return (
    <form className="preference-form" action={action}>
      <input type="hidden" name="token" value={token} />
      <label><input type="checkbox" name="emailMarketingAllowed" defaultChecked={preference.emailMarketingAllowed} /><span>Email offers and product updates</span></label>
      <label><input type="checkbox" name="smsMarketingAllowed" defaultChecked={preference.smsMarketingAllowed} /><span>SMS offers and product updates</span></label>
      <label><input type="checkbox" name="whatsappMarketingAllowed" defaultChecked={preference.whatsappMarketingAllowed} /><span>WhatsApp offers and product updates</span></label>
      <p className="preference-help">Untick every channel to unsubscribe from all optional marketing communication. Order and delivery messages required to fulfil an order are separate.</p>
      {state.message ? <p className={state.ok ? 'preference-success' : 'preference-error'} role="status">{state.message}</p> : null}
      <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save preferences'}</button>
    </form>
  );
}
