(function(){"use strict";
const SUPABASE_URL="https://yopqftofkvwrpyyluffw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY),$=id=>document.getElementById(id);
let members=[],selected=[],side="front",calibrationMode=false,printRegister=new Map(),printAttemptReady=false;
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const text=v=>String(v??"").trim(),upper=v=>text(v)?text(v).toUpperCase():"NOT PROVIDED";
async function requireAdmin(){const{data:s,error:e}=await db.auth.getSession();if(e)throw e;if(!s.session){location.href="login.html";return null}const{data,error}=await db.rpc("is_omg_admin");if(error)throw error;if(data!==true){await db.auth.signOut();location.href="login.html";return null}$("adminUserEmail").textContent=s.session.user.email||"";return s.session}
function message(m){$("pageMessage").textContent=m||""}
async function loadMembers(){const{data,error}=await db.from("members").select("id,member_id,full_name,gender,phone,lga,ward,polling_unit,membership_status,created_at").eq("membership_status","Approved").order("created_at",{ascending:false}).limit(1000);if(error)throw error;members=data||[];await loadPrintRegister();populateFilters();renderMembers()}

async function loadPrintRegister(){
  const ids=members.map(m=>m.id);printRegister=new Map();if(!ids.length)return;
  const{data,error}=await db.from("omg_card_print_register").select("member_id,status,historical_print_date,first_system_printed_at,last_printed_at,print_count,recorded_at").in("member_id",ids);
  if(error){console.warn("Card print register unavailable",error);message("Card register is not available yet. Run card-print-register.sql in Supabase.");return}
  (data||[]).forEach(r=>printRegister.set(String(r.member_id),r));updateRegisterSummary();
}
function registerFor(m){return printRegister.get(String(m.id))||{member_id:m.id,status:"never_printed",print_count:0}}
function statusLabel(r){return r.status==="previously_printed"?"PREVIOUSLY PRINTED":r.status==="printed"?"PRINTED":r.status==="reprint_damaged"?"REPRINT / DAMAGED":"NOT PRINTED"}
function statusClass(r){return r.status==="previously_printed"?"historical":r.status==="printed"?"printed":r.status==="reprint_damaged"?"reprint":"never"}
function updateRegisterSummary(){if(!$("registerSummary"))return;const counts={never_printed:0,previously_printed:0,printed:0,reprint_damaged:0};members.forEach(m=>counts[registerFor(m).status]++);$("registerSummary").textContent=`${counts.printed} printed in system • ${counts.previously_printed} previously printed • ${counts.never_printed} not printed • ${counts.reprint_damaged} reprint/damaged`;}
async function setRegisterStatus(status){if(!selected.length){message("Select at least one member first.");return}const historical=status==="previously_printed";let historicalDate=null;if(historical){const answer=prompt("Optional historical print date (YYYY-MM-DD). Leave blank if unknown.","");if(answer===null)return;historicalDate=answer.trim()||null;if(historicalDate&&!/^\d{4}-\d{2}-\d{2}$/.test(historicalDate)){message("Historical date must use YYYY-MM-DD, or be left blank.");return}}const rows=selected.map(m=>{const old=registerFor(m);return{member_id:m.id,status,historical_print_date:historical?historicalDate:null,first_system_printed_at:old.first_system_printed_at||null,last_printed_at:old.last_printed_at||null,print_count:old.print_count||0,updated_at:new Date().toISOString()}});const{error}=await db.from("omg_card_print_register").upsert(rows,{onConflict:"member_id"});if(error){message(error.message);return}await loadPrintRegister();renderMembers();message(status==="previously_printed"?`${selected.length} member card(s) marked as previously printed.`:status==="reprint_damaged"?`${selected.length} member card(s) marked reprint/damaged.`:`${selected.length} member card record(s) reset to not printed.`)}
async function confirmPrinted(){if(selected.length!==2){message("Select exactly two members for this tray.");return}if(!printAttemptReady){message("Print the front and back first, then confirm successful physical cards.");return}if(!confirm(`Confirm that BOTH physical cards were successfully printed for ${upper(selected[0].full_name)} and ${upper(selected[1].full_name)}?`))return;const now=new Date().toISOString();const rows=selected.map(m=>{const old=registerFor(m);return{member_id:m.id,status:"printed",historical_print_date:old.historical_print_date||null,first_system_printed_at:old.first_system_printed_at||now,last_printed_at:now,print_count:(old.print_count||0)+1,updated_at:now}});const{error}=await db.from("omg_card_print_register").upsert(rows,{onConflict:"member_id"});if(error){message(error.message);return}printAttemptReady=false;$("confirmPrinted").disabled=true;await loadPrintRegister();renderMembers();message("Both cards recorded as successfully printed.")}

function populateFilters(){const lgas=[...new Set(members.map(m=>m.lga).filter(Boolean))].sort();$("lgaFilter").innerHTML='<option value="">ALL LGAs</option>'+lgas.map(v=>`<option>${esc(v)}</option>`).join("");updateWardOptions()}
function updateWardOptions(){const lga=$("lgaFilter").value,wards=[...new Set(members.filter(m=>!lga||m.lga===lga).map(m=>m.ward).filter(Boolean))].sort(),old=$("wardFilter").value;$("wardFilter").innerHTML='<option value="">ALL WARDS</option>'+wards.map(v=>`<option>${esc(v)}</option>`).join("");if(wards.includes(old))$("wardFilter").value=old}
function filtered(){const q=$("memberSearch").value.trim().toLowerCase(),lga=$("lgaFilter").value,ward=$("wardFilter").value;return members.filter(m=>(!q||`${m.full_name||""} ${m.member_id||""}`.toLowerCase().includes(q))&&(!lga||m.lga===lga)&&(!ward||m.ward===ward))}
function renderMembers(){const data=filtered();$("directoryCount").textContent=`${data.length} approved member${data.length===1?"":"s"}`;$("emptyState").hidden=data.length>0;$("membersTableBody").innerHTML=data.map(m=>{const checked=selected.some(s=>String(s.id)===String(m.id));return `<tr class="${checked?"selected":""}"><td><input class="member-check" type="checkbox" data-id="${esc(m.id)}" ${checked?"checked":""}></td><td><span class="member-id">${esc(m.member_id||"-")}</span></td><td><div class="member-name">${esc(upper(m.full_name))}</div><small>${esc(upper(m.gender))}</small></td><td>${esc(upper(m.lga))}</td><td>${esc(upper(m.ward))}</td><td><span class="status-approved">APPROVED</span></td><td><span class="card-status card-status-${statusClass(registerFor(m))}">${statusLabel(registerFor(m))}</span></td></tr>`}).join("");updateSelectionUI()}
function updateSelectionUI(){const any=selected.length>0;if($("markHistorical"))$("markHistorical").disabled=!any;if($("undoHistorical"))$("undoHistorical").disabled=!any;if($("markReprint"))$("markReprint").disabled=!any;$("selectedCount").textContent=`${selected.length} SELECTED`;$("prepareTray").disabled=selected.length!==2;$("queueSummary").textContent=selected.length===2?`${upper(selected[0].full_name)} + ${upper(selected[1].full_name)}`:"Select exactly two members for the current tray."}
async function photoUrl(member){if(!member.phone||!member.member_id)return null;try{const{data,error}=await db.functions.invoke("get-member-photo",{body:{phone:member.phone,member_id:member.member_id}});if(error||!data?.photo_url)return null;return data.photo_url}catch(e){console.warn("Photo unavailable",e);return null}}
async function makeFront(member){const template=$("frontCardTemplate");if(!template)throw new Error("Front card template was not found.");const node=template.content.firstElementChild.cloneNode(true);["member_id","full_name","gender","lga","ward","polling_unit"].forEach(k=>{const field=node.querySelector(`[data-field="${k}"]`);if(field)field.textContent=upper(member[k])});const url=await photoUrl(member);if(url){const img=document.createElement("img");img.src=url;img.alt="Member photograph";const frame=node.querySelector(".membership-photo-frame");if(frame)frame.replaceChildren(img)}return node}
function makeBack(){const t=$("backCardTemplate");if(!t)throw new Error("Back card template was not found.");return t.content.firstElementChild.cloneNode(true)}
function makeCalibrationCard(n){const t=$("calibrationCardTemplate");if(!t)throw new Error("Calibration template was not found.");const node=t.content.firstElementChild.cloneNode(true);node.querySelector("[data-cal-card]").textContent=n;return node}
function setMode(mode){calibrationMode=mode==="calibration";$("printSheet").classList.toggle("calibration-mode",calibrationMode);$("calibrationHelp").hidden=!calibrationMode;$("sideSwitch").hidden=calibrationMode;$("workspaceTitle").textContent=calibrationMode?"TS704 Two-Card Calibration":"Two-Card Tray Preview"}
function renderCalibration(){setMode("calibration");$("trayWorkspace").hidden=false;$("cardSlot1").replaceChildren(makeCalibrationCard(1));$("cardSlot2").replaceChildren(makeCalibrationCard(2));applyCalibration();$("trayWorkspace").scrollIntoView({behavior:"smooth"});message("Calibration targets are exact CR80 size and use the same independent Card 1 / Card 2 positions as the real cards.")}
async function renderTray(which){if(selected.length!==2){message("Select exactly two approved members before preparing the tray.");return false}setMode("cards");side=which;$("showFront").classList.toggle("active",which==="front");$("showBack").classList.toggle("active",which==="back");$("printSheet").classList.toggle("front-mode",which==="front");$("printSheet").classList.toggle("back-mode",which==="back");$("cardSlot1").replaceChildren();$("cardSlot2").replaceChildren();if(which==="front"){const cards=await Promise.all(selected.map(makeFront));if(cards[0])$("cardSlot1").append(cards[0]);if(cards[1])$("cardSlot2").append(cards[1])}else{$("cardSlot1").append(makeBack());$("cardSlot2").append(makeBack())}return true}
function calibrationValues(){return{c1x:parseFloat($("card1X").value)||0,c1y:parseFloat($("card1Y").value)||0,c2x:parseFloat($("card2X").value)||0,c2y:parseFloat($("card2Y").value)||0,rotation:parseInt($("trayRotation").value,10)===0?0:180}}
function applyCalibration(){const c=calibrationValues(),sheet=$("printSheet");sheet.style.setProperty("--card1-x",`${c.c1x}mm`);sheet.style.setProperty("--card1-y",`${c.c1y}mm`);sheet.style.setProperty("--card2-x",`${c.c2x}mm`);sheet.style.setProperty("--card2-y",`${c.c2y}mm`);sheet.style.setProperty("--tray-rotation",`${c.rotation}deg`)}
function loadCalibration(){try{const old=JSON.parse(localStorage.getItem("omgTs704Calibration")||"{}"),c=JSON.parse(localStorage.getItem("omgTs704CalibrationV2")||"{}");$("card1X").value=c.c1x??old.x??0;$("card1Y").value=c.c1y??old.y??0;$("card2X").value=c.c2x??old.x??0;$("card2Y").value=c.c2y??0;$("trayRotation").value=String(c.rotation??180)}catch(e){console.warn("Unable to read saved tray calibration.",e)}applyCalibration()}
function saveCalibration(){const c=calibrationValues();localStorage.setItem("omgTs704CalibrationV2",JSON.stringify(c));applyCalibration();message(`TS704 preset saved. Card 1: X ${c.c1x}, Y ${c.c1y} mm. Card 2: X ${c.c2x}, Y ${c.c2y} mm. Rotation ${c.rotation}°.`)}
function resetCalibration(){$("card1X").value=0;$("card1Y").value=0;$("card2X").value=0;$("card2Y").value=0;$("trayRotation").value="180";applyCalibration();message("Calibration reset. CR80 remains locked at 85.60 × 53.98 mm; rotation reset to 180°.")}
async function awaitPrintImages(root){
  const images=[...root.querySelectorAll("img")];
  await Promise.all(images.map(async img=>{
    if(!img.getAttribute("src"))return;
    if(!img.complete){await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error("Image loading timed out: "+(img.alt||"photo"))),12000);img.addEventListener("load",()=>{clearTimeout(timeout);resolve()},{once:true});img.addEventListener("error",()=>{clearTimeout(timeout);reject(new Error("Image could not load: "+(img.alt||"photo")))},{once:true})})}
    if(!img.naturalWidth)throw new Error("Image is missing from print: "+(img.alt||"photo"));
    if(typeof img.decode==="function")await img.decode();
  }));
}
async function preparePrintPortal(){
  const portal=$("printPortal"),sheet=$("printSheet");
  // Prefer embedding member photos into the print clone to avoid a fresh
  // cross-origin/signed URL request during Chrome's print preview.
  const copy=sheet.cloneNode(true);
  const originalPhotos=[...sheet.querySelectorAll(".membership-photo-frame img")];
  const clonedPhotos=[...copy.querySelectorAll(".membership-photo-frame img")];
  originalPhotos.forEach((source,i)=>{
    if(!source.complete||!source.naturalWidth)return;
    try{
      const canvas=document.createElement("canvas");canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
      canvas.getContext("2d").drawImage(source,0,0);
      clonedPhotos[i].src=canvas.toDataURL("image/png");
    }catch(e){console.warn("Photo could not be embedded; using original URL",e)}
  });
  portal.replaceChildren(copy);
  await awaitPrintImages(portal);
  if(clonedPhotos.length && clonedPhotos.length!==2)throw new Error("Member photographs are incomplete. Printing cancelled.");
  if(side==="front" && !calibrationMode && clonedPhotos.length!==2)throw new Error("Member photographs are missing. Printing cancelled. Check photo access and retry.");
}
async function doPrint(which){try{const ok=await renderTray(which);if(ok){await preparePrintPortal();window.print();if(which==="back"){printAttemptReady=true;if($("confirmPrinted"))$("confirmPrinted").disabled=false}}}catch(e){console.error(e);message(e.message||"Unable to prepare cards for printing.")}}
async function printCalibration(){try{renderCalibration();await preparePrintPortal();window.print()}catch(e){console.error(e);message(e.message||"Calibration preview failed.")}}
document.addEventListener("DOMContentLoaded",async()=>{try{if(!await requireAdmin())return;loadCalibration();await loadMembers()}catch(e){console.error(e);message(e.message||"Unable to load card printing module.");return}
$("membersTableBody").addEventListener("change",e=>{const cb=e.target.closest(".member-check");if(!cb)return;const m=members.find(x=>String(x.id)===String(cb.dataset.id));if(!m)return;if(cb.checked){if(selected.length>=2){cb.checked=false;message("The TS704a tray holds two cards. Clear a slot before selecting another member.");return}selected.push(m)}else selected=selected.filter(x=>String(x.id)!==String(m.id));message("");renderMembers()});
$("memberSearch").addEventListener("input",renderMembers);$("lgaFilter").addEventListener("change",()=>{updateWardOptions();renderMembers()});$("wardFilter").addEventListener("change",renderMembers);
$("resetFilters").addEventListener("click",()=>{$("memberSearch").value="";$("lgaFilter").value="";updateWardOptions();$("wardFilter").value="";renderMembers()});
$("clearSelection").addEventListener("click",()=>{selected=[];renderMembers();$("trayWorkspace").hidden=true});
$("prepareTray").addEventListener("click",async()=>{$("trayWorkspace").hidden=false;try{await renderTray("front");$("trayWorkspace").scrollIntoView({behavior:"smooth"})}catch(e){console.error(e);message(e.message||"Unable to prepare front cards.")}});
$("showFront").addEventListener("click",()=>renderTray("front").catch(e=>message(e.message||"Unable to display front cards.")));$("showBack").addEventListener("click",()=>renderTray("back").catch(e=>message(e.message||"Unable to display card backs.")));
["card1X","card1Y","card2X","card2Y","trayRotation"].forEach(id=>$(id).addEventListener("input",applyCalibration));
$("openCalibration").addEventListener("click",renderCalibration);$("saveCalibration").addEventListener("click",saveCalibration);$("resetCalibration").addEventListener("click",resetCalibration);$("printCalibration").addEventListener("click",printCalibration);
$("printFront").addEventListener("click",()=>doPrint("front"));$("printBack").addEventListener("click",()=>doPrint("back"));$("confirmPrinted").addEventListener("click",confirmPrinted);$("markHistorical").addEventListener("click",()=>setRegisterStatus("previously_printed"));$("undoHistorical").addEventListener("click",()=>setRegisterStatus("never_printed"));$("markReprint").addEventListener("click",()=>setRegisterStatus("reprint_damaged"));
$("logoutButton").addEventListener("click",async()=>{await db.auth.signOut();location.href="login.html"});
});})();