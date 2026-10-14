(async()=>{
 const db=window.supabase.createClient('https://yopqftofkvwrpyyluffw.supabase.co','sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL');
 const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let claims=[];
 const {data:{session}}=await db.auth.getSession();
 if(!session){location.href='login.html';return}
 const {data:admin,error:authError}=await db.rpc('is_omg_admin');
 if(authError||admin!==true){$('status').textContent='Administrator access required';return}
 async function load(){const {data,error}=await db.from('omg_referral_claims').select('*').order('created_at',{ascending:false}).limit(1000);if(error){$('status').textContent=error.message;return}claims=data||[];$('status').textContent=`${claims.length} claims shown, ${claims.filter(x=>x.status==='verified').length} verified, ${claims.filter(x=>x.status==='pending').length} pending`;
 $('rows').innerHTML=claims.map(x=>`<tr><td>${esc(x.member_id)}</td><td>${esc(x.referrer_code)}</td><td>${esc(x.referrer_name)}</td><td>${esc(x.status)}</td><td>${esc(x.verified_referrer_id)}</td><td>${x.status==='pending'?`<button data-id="${esc(x.id)}">Verify code</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6">No referral claims yet</td></tr>';}
 $('rows').addEventListener('click',async e=>{const b=e.target.closest('button[data-id]');if(!b)return;const claim=claims.find(x=>x.id===b.dataset.id);if(!claim?.referrer_code){alert('No referral code. Investigate name-only referrals manually before attribution.');return}b.disabled=true;
 const {data:ref,error}=await db.from('members').select('id,member_id,full_name').eq('member_id',claim.referrer_code).limit(2);
 if(error||!ref||ref.length!==1){alert('No unique referrer found for this code.');b.disabled=false;return}
 if(ref[0].member_id===claim.member_id){alert('Self-referrals are not allowed');b.disabled=false;return}
 if(!confirm(`Verify referral to ${ref[0].full_name} (${ref[0].member_id})?`)){b.disabled=false;return}
 const {error:saveError}=await db.from('omg_referral_claims').update({status:'verified',verified_referrer_id:ref[0].id,verified_at:new Date().toISOString()}).eq('id',claim.id).eq('status','pending');if(saveError)alert(saveError.message);await load();});
 $('refresh').onclick=load;
 $('export').onclick=()=>{const header=['member_id','referrer_code','referrer_name','status','verified_referrer_id','created_at'];const csv=[header,...claims.map(c=>header.map(k=>c[k]??''))].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='OMG-referrals.csv';a.click();URL.revokeObjectURL(a.href)};
 await load();
})();
