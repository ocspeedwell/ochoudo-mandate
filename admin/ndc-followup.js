/* OMG administrative follow-up and bulk approvals. No member records are removed. */
(() => {
 const $ = id => document.getElementById(id);
 const db = window.supabase.createClient('https://yopqftofkvwrpyyluffw.supabase.co','sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL');
 const selected = new Set(); let rows = [], flags = new Map(), ready = false;
 const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ndc = v => v === true || v === 1 || ['true','yes','1','y'].includes(String(v??'').trim().toLowerCase());
 const missing = m => ndc(m.ndc_member) && !String(m.ndc_card_number??'').trim();
 const msg = s => $('ndcActionMessage').textContent = s;
 async function fetchAll(query) { let out=[]; for(let i=0;;i+=1000){const {data,error}=await query(i).range(i,i+999);if(error)throw error;out.push(...(data||[]));if(!data||data.length<1000)break;}return out; }
 async function refresh() {
  try {
   rows = await fetchAll(i=>db.from('members').select('id,member_id,full_name,phone,lga,ward,membership_status,ndc_member,ndc_card_number').order('id'));
   try {const f=await fetchAll(i=>db.from('omg_ndc_followups').select('member_id,flagged,note').order('member_id'));flags=new Map(f.map(x=>[x.member_id,x]));ready=true;}catch(e){ready=false;msg('Manual follow-up marking requires running admin/ndc-followup.sql in Supabase. Automatic missing-number detection is available.');}
   draw();
  } catch(e){msg('Unable to load NDC follow-up register: '+e.message);}
 }
 function matching(){const l=$('lgaFilter').value,w=$('wardFilter').value,mode=$('ndcNumberFilter').value;
  return rows.filter(m=>(!l||m.lga===l)&&(!w||m.ward===w)&&(!mode||(mode==='missing'&&missing(m))||(mode==='submitted'&&ndc(m.ndc_member)&&!missing(m))||(mode==='flagged'&&flags.get(m.id)?.flagged)));
 }
 function draw(){const items=matching();$('ndcMissingCount').textContent=rows.filter(missing).length;$('ndcFlaggedCount').textContent=rows.filter(m=>flags.get(m.id)?.flagged).length;
  $('ndcRegisterCount').textContent=`${items.length} matching members`;
  $('ndcRegisterBody').innerHTML=items.map(m=>`<tr><td><input type="checkbox" class="ndc-select" data-id="${esc(m.id)}" ${selected.has(m.id)?'checked':''} aria-label="Select ${esc(m.full_name)}"></td><td>${esc(m.full_name)}<small style="display:block">${esc(m.member_id)}</small></td><td>${esc(m.phone)}</td><td>${esc(m.lga)} / ${esc(m.ward)}</td><td>${esc(m.membership_status||'Pending')}</td><td>${missing(m)?'MISSING':esc(m.ndc_card_number||'Not applicable')}</td><td><input type="checkbox" class="ndc-flag" data-id="${esc(m.id)}" ${flags.get(m.id)?.flagged?'checked':''} ${!ready?'disabled title="Run SQL setup first"':''} aria-label="Mark for follow-up"></td></tr>`).join('');
  $('ndcSelectedCount').textContent=`${selected.size} selected`;
 }
 async function flag(id,checked){if(!ready)return;const old=flags.get(id);const {error}=await db.from('omg_ndc_followups').upsert({member_id:id,flagged:checked,note:old?.note||'',updated_at:new Date().toISOString(),updated_by:(await db.auth.getUser()).data.user?.id});if(error){msg(error.message);draw();return;}flags.set(id,{flagged:checked});draw();msg('Follow-up flag saved.');}
 async function approve(){const ids=[...selected];const pending=rows.filter(m=>ids.includes(m.id)&&String(m.membership_status||'Pending').toLowerCase()==='pending');if(!pending.length){msg('No pending members selected.');return;}
  if(!confirm(`Approve ${pending.length} pending OMG members? This does not change NDC number status.`))return;
  $('ndcBulkApprove').disabled=true;let ok=0,failed=0;
  for(const m of pending){const {data,error}=await db.from('members').update({membership_status:'Approved'}).eq('id',m.id).eq('membership_status','Pending').select('id');if(error||!data?.length)failed++;else{ok++;selected.delete(m.id);}}
  $('ndcBulkApprove').disabled=false;msg(`${ok} approved; ${failed} not updated. Refreshing register.`);await refresh();
  // Reload directory to reflect changed membership statuses.
  $('statusFilter').dispatchEvent(new Event('change'));
 }
 function print(){const items=matching();const win=window.open('','_blank');if(!win){msg('Allow popups to print.');return;}win.document.write(`<html><head><title>OMG NDC Follow-Up Register</title><style>body{font:12px Arial}table{width:100%;border-collapse:collapse}td,th{border:1px solid #999;padding:6px;text-align:left}@page{size:A4 landscape}</style></head><body><h2>OCHOUDO MANDATE GROUP | NDC NUMBER FOLLOW-UP</h2><p>${new Date().toLocaleString()} | ${items.length} records | Confidential</p><table><tr><th>Name</th><th>Member ID</th><th>Phone</th><th>LGA</th><th>Ward</th><th>Number</th><th>Follow-up</th></tr>${items.map(m=>`<tr><td>${esc(m.full_name)}</td><td>${esc(m.member_id)}</td><td>${esc(m.phone)}</td><td>${esc(m.lga)}</td><td>${esc(m.ward)}</td><td>${esc(m.ndc_card_number||'MISSING')}</td><td>${flags.get(m.id)?.flagged?'YES':''}</td></tr>`).join('')}</table><script>window.print()<\/script></body></html>`);win.document.close();}
 document.addEventListener('DOMContentLoaded',async()=>{const {data}=await db.auth.getSession();if(!data.session)return;const a=await db.rpc('is_omg_admin');if(a.error||a.data!==true)return;
  $('ndcNumberFilter').addEventListener('change',draw);$('lgaFilter').addEventListener('change',()=>setTimeout(draw,0));$('wardFilter').addEventListener('change',draw);
  $('ndcRegisterBody').addEventListener('change',e=>{const t=e.target,id=t.dataset.id;if(!id)return;if(t.classList.contains('ndc-select')){t.checked?selected.add(id):selected.delete(id);draw();}if(t.classList.contains('ndc-flag'))flag(id,t.checked);});
  $('ndcSelectVisible').addEventListener('click',()=>{matching().forEach(m=>selected.add(m.id));draw();});$('ndcClearSelected').addEventListener('click',()=>{selected.clear();draw();});$('ndcBulkApprove').addEventListener('click',approve);$('ndcPrint').addEventListener('click',print);$('ndcRefresh').addEventListener('click',refresh);await refresh();
 });
})();
