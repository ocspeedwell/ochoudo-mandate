/* Admin-only referral panel. Reads claims through existing Supabase RLS. */
(() => {
  const box = document.getElementById('referralProfileContent');
  if (!box) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const base = new URL('../membership.html', location.href);
  let requestId = 0;
  async function render(member) {
    const current = ++requestId;
    const code = String(member.member_id || '').trim();
    if (!code) { box.textContent = 'This member does not yet have a membership ID.'; return; }
    const link = new URL(base.href); link.searchParams.set('ref', code);
    box.innerHTML = `<p><strong>Referral code:</strong> ${esc(code)}</p><p><strong>Personal referral link:</strong> <a href="${esc(link.href)}" target="_blank" rel="noopener">${esc(link.href)}</a></p><button type="button" id="copyMemberReferralLink" class="directory-reset">Copy referral link</button><p id="referralCounts">Loading referral counts...</p>`;
    box.querySelector('#copyMemberReferralLink').onclick = async () => {
      try { await navigator.clipboard.writeText(link.href); box.querySelector('#copyMemberReferralLink').textContent = 'Copied!'; }
      catch { window.prompt('Copy referral link:', link.href); }
    };
    try {
      // The existing admin page's Supabase client is lexical, so use the same configured public client with the current session.
      const client = window.supabase.createClient('https://yopqftofkvwrpyyluffw.supabase.co','sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL');
      const {data, error} = await client.from('omg_referral_claims').select('member_id,referrer_code,status,verified_referrer_id').or(`referrer_code.eq.${code},verified_referrer_id.eq.${member.id}`);
      if (error) throw error;
      if (current !== requestId) return;
      const claims = data || [];
      const verified = claims.filter(c => c.status === 'verified' && c.verified_referrer_id === member.id).length;
      const pending = claims.filter(c => c.status === 'pending' && c.referrer_code === code).length;
      const other = claims.filter(c => c.status !== 'pending' && !(c.status === 'verified' && c.verified_referrer_id === member.id)).length;
      box.querySelector('#referralCounts').textContent = `Verified referrals: ${verified} | Pending code claims: ${pending} | Other code claims: ${other}. Name-only pending claims are not included until attributed.`;
    } catch (err) { if(current === requestId) box.querySelector('#referralCounts').textContent = 'Referral counts unavailable: ' + err.message; }
  }
  // Observe existing modal member ID, so no changes to member approval or directory logic are required.
  const idEl = document.getElementById('modalMemberId');
  if (!idEl) return;
  const observer = new MutationObserver(() => {
    const code = idEl.textContent.trim();
    if (!code || code === '-' || code === 'LOADING...') return;
    const client = window.supabase.createClient('https://yopqftofkvwrpyyluffw.supabase.co','sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL');
    client.from('members').select('id,member_id').eq('member_id',code).maybeSingle().then(({data,error}) => { if (!error && data && idEl.textContent.trim() === code) render(data); });
  });
  observer.observe(idEl,{childList:true,characterData:true,subtree:true});
})();
