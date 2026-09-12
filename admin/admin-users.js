(function () {
  "use strict";
  const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const $ = (id) => document.getElementById(id);
  let roles = [];
  let admins = [];
  let editingId = null;

  function message(text) { $("pageMessage").textContent = text || ""; }
  function editMessage(text) { $("editMessage").textContent = text || ""; }
  function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

  async function requireSuperAdmin() {
    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) { location.href = "login.html"; return false; }
    const { data, error } = await db.rpc("omg_get_my_admin_profile");
    if (error) throw error;
    if (!data || !data[0] || data[0].role_code !== "super_admin" || data[0].active !== true) {
      alert("Super Administrator access is required.");
      location.href = "dashboard.html";
      return false;
    }
    return true;
  }

  function fillRoleSelect(select, includeAll) {
    select.innerHTML = includeAll ? '<option value="">Select role</option>' : "";
    roles.forEach(r => {
      const option = document.createElement("option");
      option.value = r.role_code;
      option.textContent = r.role_title;
      select.appendChild(option);
    });
  }

  const permissionLabels = {
    "dashboard.view":"Dashboard", "members.view":"View Members", "members.manage":"Manage Members",
    "command.view":"Command Centre", "command.manage":"Manage Command",
    "deployment.view":"Deployment", "deployment.manage":"Manage Deployment",
    "polling.view":"Polling Unit Operations", "polling.manage":"Manage Polling Units",
    "reports.view":"Reports & Intelligence", "verify.view":"Membership Verification",
    "admins.manage":"Administrator Management"
  };

  function renderRoleCards() {
    $("roleCards").innerHTML = roles.map(r => {
      const access = (r.permissions || []).map(p => permissionLabels[p] || p).join(" • ");
      return `<div class="role-card"><strong>${esc(r.role_title)}</strong><span>${esc(r.description)}</span><div class="sub" style="margin-top:8px"><b>ACCESS:</b> ${esc(access)}</div></div>`;
    }).join("");
  }

  function renderAdmins() {
    $("adminTableBody").innerHTML = admins.map(a => `
      <tr>
        <td><div class="name">${esc(a.full_name || "Unnamed administrator")}</div><div class="sub">${esc(a.email)}</div></td>
        <td><span class="role">${esc(a.role_title)}</span><div class="sub">${esc(a.role_code)}</div></td>
        <td>${esc(a.role_description)}</td>
        <td><span class="badge ${a.active ? "active" : "inactive"}">${a.active ? "ACTIVE" : "INACTIVE"}</span></td>
        <td><div class="actions"><button class="btn small edit" data-edit="${esc(a.user_id)}">EDIT</button></div></td>
      </tr>`).join("");
  }

  async function load() {
    const allowed = await requireSuperAdmin();
    if (!allowed) return;
    const [rolesResult, adminsResult] = await Promise.all([
      db.rpc("get_omg_admin_roles"),
      db.rpc("get_omg_admin_users")
    ]);
    if (rolesResult.error) throw rolesResult.error;
    if (adminsResult.error) throw adminsResult.error;
    roles = Array.isArray(rolesResult.data) ? rolesResult.data : [];
    admins = Array.isArray(adminsResult.data) ? adminsResult.data : [];
    fillRoleSelect($("newRole"), true);
    fillRoleSelect($("editRole"), false);
    renderRoleCards();
    renderAdmins();
  }

  async function createAdmin() {
    const fullName = $("newFullName").value.trim();
    const email = $("newEmail").value.trim();
    const roleCode = $("newRole").value;
    if (!fullName || !email || !roleCode) { message("Please provide the full name, email address and role."); return; }
    const button = $("createButton");
    button.disabled = true;
    button.textContent = "SENDING...";
    message("Creating administrator account and sending invitation...");
    try {
      const { data, error } = await db.functions.invoke("admin-create-user", { body: { full_name: fullName, email, role_code: roleCode } });
      if (error) throw error;
      if (!data || !data.ok) throw new Error(data?.error || "Unable to create administrator.");
      $("newFullName").value = "";
      $("newEmail").value = "";
      $("newRole").value = "";
      message("Administrator invitation sent successfully to " + email + ".");
      const result = await db.rpc("get_omg_admin_users");
      if (!result.error) { admins = result.data || []; renderAdmins(); }
    } catch (e) {
      console.error(e);
      message(e.message || "Unable to create administrator.");
    } finally {
      button.disabled = false;
      button.textContent = "SEND INVITATION";
    }
  }

  function openEdit(userId) {
    const admin = admins.find(a => a.user_id === userId);
    if (!admin) return;
    editingId = userId;
    $("editEmail").textContent = admin.email;
    $("editFullName").value = admin.full_name || "";
    $("editRole").value = admin.role_code;
    $("editActive").value = String(admin.active);
    editMessage("");
    $("editModal").hidden = false;
  }

  async function saveEdit() {
    if (!editingId) return;
    const button = $("saveEdit");
    button.disabled = true;
    editMessage("Saving administrator access...");
    try {
      const { data, error } = await db.rpc("update_omg_admin_user", {
        p_user_id: editingId,
        p_full_name: $("editFullName").value.trim(),
        p_role_code: $("editRole").value,
        p_active: $("editActive").value === "true"
      });
      if (error) throw error;
      if (data !== true) throw new Error("No administrator record was updated.");
      $("editModal").hidden = true;
      editingId = null;
      message("Administrator access updated successfully.");
      const result = await db.rpc("get_omg_admin_users");
      if (result.error) throw result.error;
      admins = result.data || [];
      renderAdmins();
    } catch (e) {
      console.error(e);
      editMessage(e.message || "Unable to update administrator.");
    } finally { button.disabled = false; }
  }

  document.addEventListener("DOMContentLoaded", function () {
    load().catch(e => { console.error(e); message(e.message || "Unable to load administrator management."); });
    $("createButton").addEventListener("click", createAdmin);
    $("cancelEdit").addEventListener("click", () => { $("editModal").hidden = true; editingId = null; });
    $("saveEdit").addEventListener("click", saveEdit);
    $("adminTableBody").addEventListener("click", e => { const btn = e.target.closest("[data-edit]"); if (btn) openEdit(btn.dataset.edit); });
    $("logoutButton").addEventListener("click", async () => { await db.auth.signOut(); location.href = "login.html"; });
  });
})();
