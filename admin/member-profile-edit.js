/* Member corrections. All writes go through audited, administrator-checked RPC. */
(() => {
  const url = 'https://yopqftofkvwrpyyluffw.supabase.co';
  const key = 'sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL';
  const db = window.supabase.createClient(url, key);
  const $ = id => document.getElementById(id);
  const form = $('memberEditForm');
  let current = null;
  const fields = ['full_name','phone','email','lga','ward','polling_unit','ndc_member','ndc_card_number'];
  const hide = () => { form.hidden = true; form.style.display = 'none'; $('memberEditMessage').textContent = ''; };
  $('toggleMemberEdit').addEventListener('click', async () => {
    const idText = $('modalMemberId').textContent.trim();
    const { data, error } = await db.from('members').select('id,member_id,full_name,phone,email,lga,ward,polling_unit,ndc_member,ndc_card_number').eq('member_id',idText).maybeSingle();
    if (error || !data) { alert('Unable to load member for editing.'); return; }
    current = data;
    fields.forEach(k => { const input = form.elements.namedItem(k); if (input) input.value = k === 'ndc_member' ? (['true','yes','1'].includes(String(data[k]).toLowerCase()) ? 'true' : 'false') : (data[k] ?? ''); });
    form.elements.namedItem('reason').value = '';
    form.hidden = false; form.style.display = 'grid';
  });
  $('cancelMemberEdit').addEventListener('click',hide);
  $('closeModal').addEventListener('click',hide);
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (!current) return;
    const button = $('saveMemberEdit'); button.disabled = true;
    const message = $('memberEditMessage'); message.textContent = 'Saving changes...';
    try {
      const changes = {};
      fields.forEach(k => { const value = form.elements.namedItem(k).value.trim(); changes[k] = k === 'ndc_member' ? value === 'true' : (value || null); });
      if (!changes.full_name || !changes.phone) throw Error('Name and phone are required.');
      const reason = form.elements.namedItem('reason').value.trim();
      if (reason.length < 8) throw Error('Please explain the correction.');
      const {error} = await db.rpc('omg_update_member_profile', {p_member_id: current.id, p_changes: changes, p_reason: reason});
      if (error) throw error;
      message.textContent = 'Profile saved successfully. Changes were recorded in the audit log.';
      $('modalMemberName').textContent = changes.full_name.toUpperCase();
      // Refresh the member profile to show persisted values.
      setTimeout(() => { $('closeModal').click(); location.reload(); }, 1400);
    } catch(err) { message.textContent = 'Update failed: ' + (err.message || err); }
    finally { button.disabled = false; }
  });
})();
