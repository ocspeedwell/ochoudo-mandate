(() => {
  'use strict';
  const db = window.supabase.createClient('https://yopqftofkvwrpyyluffw.supabase.co', 'sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL');
  const $ = id => document.getElementById(id);
  const PAGE_SIZE = 25;
  let page = 0, hasNext = false, editing = null, currentRows = [];
  const status = (message, error = false) => { $('status').textContent = message; $('status').style.color = error ? '#a5202c' : '#17633a'; };
  function resetForm() { editing = null; $('contactForm').reset(); $('formTitle').textContent = 'Add voluntary contact'; $('save').textContent = 'Save contact'; }
  async function requireAdmin() {
    const { data: auth, error: authError } = await db.auth.getUser();
    if (authError || !auth.user) { location.href = 'login.html'; return false; }
    const { data: allowed, error } = await db.rpc('is_omg_admin');
    if (error || allowed !== true) { status('Administrator access required.', true); return false; }
    return true;
  }
  function cell(tr, value) { const td = document.createElement('td'); td.textContent = value == null ? '' : String(value); tr.appendChild(td); return td; }
  function renderRows() {
    const needle = $('search').value.trim().toLowerCase();
    const shown = currentRows.filter(r => !needle || `${r.full_name} ${r.phone}`.toLowerCase().includes(needle));
    $('rows').replaceChildren();
    if (!shown.length) { const tr = document.createElement('tr'); const td = cell(tr, 'No matching contacts on this page.'); td.colSpan = 5; $('rows').append(tr); }
    for (const r of shown) {
      const tr = document.createElement('tr');
      cell(tr, r.full_name); cell(tr, r.phone); cell(tr, r.consent_source); cell(tr, new Date(r.created_at).toLocaleDateString());
      const actions = cell(tr, '');
      const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.addEventListener('click', () => {
        editing = r.id; $('fullName').value = r.full_name; $('phone').value = r.phone; $('email').value = r.email || '';
        $('consentSource').value = r.consent_source; $('consentReference').value = r.consent_reference;
        $('consentConfirmed').checked = false; $('formTitle').textContent = 'Update voluntary contact'; $('save').textContent = 'Update contact'; window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Delete'; del.style.marginLeft = '6px'; del.addEventListener('click', async () => {
        if (!confirm('Permanently delete this voluntary contact?')) return;
        const { error } = await db.from('omg_voluntary_contacts').delete().eq('id', r.id);
        if (error) return status(error.message, true);
        if (editing === r.id) resetForm(); await load(); status('Contact deleted.');
      });
      actions.append(edit, del); $('rows').append(tr);
    }
    $('pageInfo').textContent = `Page ${page + 1}`; $('prev').disabled = page === 0; $('next').disabled = !hasNext;
  }
  async function load() {
    const { data, error } = await db.from('omg_voluntary_contacts')
      .select('id,full_name,phone,email,consent_source,consent_reference,created_at')
      .order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    if (error) { status(error.message, true); return; }
    hasNext = data.length > PAGE_SIZE; currentRows = data.slice(0, PAGE_SIZE); renderRows();
  }
  async function save(event) {
    event.preventDefault();
    if (!$('consentConfirmed').checked) return status('Explicit consent confirmation is required.', true);
    const record = {
      full_name: $('fullName').value.trim(), phone: $('phone').value.trim(), email: $('email').value.trim() || null,
      consent_source: $('consentSource').value, consent_reference: $('consentReference').value.trim()
    };
    if (!record.full_name || !record.phone || !record.consent_reference) return status('Complete the required fields.', true);
    $('save').disabled = true;
    try {
      const result = editing
        ? await db.from('omg_voluntary_contacts').update(record).eq('id', editing)
        : await db.from('omg_voluntary_contacts').insert(record);
      if (result.error) throw result.error;
      resetForm(); page = 0; await load(); status('Voluntary contact saved.');
    } catch (e) { status(e.message || 'Unable to save contact.', true); }
    finally { $('save').disabled = false; }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    if (!await requireAdmin()) return;
    $('workspace').hidden = false; $('contactForm').addEventListener('submit', save);
    $('reset').addEventListener('click', resetForm); $('search').addEventListener('input', renderRows);
    $('prev').addEventListener('click', async () => { if (page > 0) { page--; await load(); } });
    $('next').addEventListener('click', async () => { if (hasNext) { page++; await load(); } });
    await load(); status('Administrator access verified.');
  });
})();
