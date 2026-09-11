(function () {
    const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const PAGE_SIZE = 50;
    let page = 0;
    let totalCount = 0;
    let currentMember = null;

    const $ = id => document.getElementById(id);
    const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
    const display = value => value === null || value === undefined || value === "" ? "Not provided" : String(value).toUpperCase();

    async function requireAdmin() {
        const { data: sessionData, error: sessionError } = await db.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) { window.location.href = "login.html"; return null; }
        const { data, error } = await db.rpc("is_omg_admin");
        if (error) throw error;
        if (data !== true) { await db.auth.signOut(); window.location.href = "login.html"; return null; }
        $("adminUserEmail").textContent = sessionData.session.user.email || "";
        return sessionData.session;
    }

    function setMessage(message) { $("directoryMessage").textContent = message || ""; }
    function setModalMessage(message) { $("modalMessage").textContent = message || ""; }

    function statusClass(status) {
        const s = String(status || "Pending").toLowerCase();
        return s === "approved" ? "status-approved" : s === "rejected" ? "status-rejected" : "status-pending";
    }

    function buildQuery() {
        const search = $("memberSearch").value.trim();
        const status = $("statusFilter").value;
        const ndc = $("ndcFilter").value;
        const gender = $("genderFilter").value;
        let query = db.from("members").select("id,member_id,full_name,gender,phone,email,lga,ward,polling_unit,membership_status,ndc_member,registration_date,created_at", { count: "exact" });
        if (status) query = query.eq("membership_status", status);
        if (ndc !== "") query = query.eq("ndc_member", ndc === "true");
        if (gender) query = query.eq("gender", gender);
        if (search) {
            const safe = search.replace(/,/g, " ");
            query = query.or(`full_name.ilike.%${safe}%,member_id.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`);
        }
        const from = page * PAGE_SIZE;
        return query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    }

    async function loadMembers() {
        setMessage("");
        $("membersTableBody").innerHTML = "";
        $("emptyState").hidden = true;
        const { data, error, count } = await buildQuery();
        if (error) throw error;
        totalCount = Number(count || 0);
        if (!data || data.length === 0) {
            $("emptyState").hidden = false;
        } else {
            data.forEach(member => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><span class="member-id">${escapeHtml(member.member_id || "-")}</span></td>
                    <td><div class="member-name">${escapeHtml(display(member.full_name))}</div><div class="member-sub">${escapeHtml(display(member.gender))}</div></td>
                    <td>${escapeHtml(member.phone || "-")}</td>
                    <td>${escapeHtml(display(member.lga))}</td>
                    <td>${escapeHtml(display(member.ward))}</td>
                    <td><span class="status-badge ${statusClass(member.membership_status)}">${escapeHtml(display(member.membership_status || "Pending"))}</span></td>
                    <td><button type="button" class="view-member-button" data-member-id="${escapeHtml(member.id)}">VIEW</button></td>`;
                $("membersTableBody").appendChild(tr);
            });
        }
        const start = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
        const end = Math.min((page + 1) * PAGE_SIZE, totalCount);
        $("directoryCount").textContent = `${start}-${end} of ${totalCount} member${totalCount === 1 ? "" : "s"}`;
        const pages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
        $("pageInfo").textContent = `PAGE ${page + 1} OF ${pages}`;
        $("paginationText").textContent = `PAGE ${page + 1}`;
        $("previousPage").disabled = page === 0;
        $("nextPage").disabled = (page + 1) * PAGE_SIZE >= totalCount;
    }

    async function openMember(id) {
        setModalMessage("");
        $("memberPhotoContainer").className = "photo-placeholder";
        $("memberPhotoContainer").textContent = "LOADING PHOTO...";
        const { data, error } = await db.from("members").select("*").eq("id", id).single();
        if (error) { alert("Unable to load this member record."); return; }
        currentMember = data;
        $("modalMemberName").textContent = display(data.full_name);
        $("modalMemberId").textContent = display(data.member_id);
        $("modalMemberStatus").innerHTML = `<span class="status-badge ${statusClass(data.membership_status)}">${escapeHtml(display(data.membership_status || "Pending"))}</span>`;
        const fields = [
            ["FULL NAME", data.full_name], ["DATE OF BIRTH", data.date_of_birth], ["GENDER", data.gender], ["PHONE", data.phone], ["EMAIL", data.email],
            ["LGA", data.lga], ["WARD", data.ward], ["POLLING UNIT", data.polling_unit], ["POLLING UNIT CODE", data.polling_unit_code],
            ["COUNTRY OF RESIDENCE", data.residence_country], ["STATE / PROVINCE", data.residence_state], ["CITY", data.residence_city], ["OCCUPATION", data.occupation],
            ["PROFESSIONAL SKILLS", data.professional_skills], ["INTERESTS", Array.isArray(data.interests) ? data.interests.join(", ") : data.interests],
            ["REASON FOR JOINING", data.reason_for_joining], ["NDC MEMBER", data.ndc_member ? "YES" : "NO"], ["NDC CARD NUMBER", data.ndc_card_number],
            ["DECLARATION CONFIRMED", data.declaration_confirmed ? "YES" : "NO"], ["DECLARATION NAME", data.declaration_name], ["REGISTRATION DATE", data.registration_date]
        ];
        $("memberDetailGrid").innerHTML = fields.map(([label,value]) => `<div class="member-detail-box ${String(value || "").length > 70 ? "wide" : ""}"><span>${label}</span><strong>${escapeHtml(display(value))}</strong></div>`).join("");
        updateActionButtons(data.membership_status);
        $("memberModal").classList.add("show");
        $("memberModal").setAttribute("aria-hidden", "false");
        loadPhoto(data);
    }

    async function loadPhoto(member) {
        if (!member.phone || !member.member_id) { setPhotoPlaceholder("PHOTO NOT AVAILABLE"); return; }
        try {
            const { data, error } = await db.functions.invoke("get-member-photo", { body: { phone: member.phone, member_id: member.member_id } });
            if (error || !data || !data.url) throw error || new Error("No photo URL");
            const img = document.createElement("img");
            img.className = "member-profile-photo";
            img.alt = "Member photograph";
            img.src = data.url;
            $("memberPhotoContainer").replaceWith(img);
            img.id = "memberPhotoContainer";
        } catch (e) { console.warn("Member photo unavailable", e); setPhotoPlaceholder("PHOTO NOT AVAILABLE"); }
    }

    function setPhotoPlaceholder(text) {
        const current = $("memberPhotoContainer");
        if (!current) return;
        current.className = "photo-placeholder";
        current.textContent = text;
    }

    function updateActionButtons(status) {
        const s = String(status || "Pending").toLowerCase();
        $("approveMember").disabled = s === "approved";
        $("rejectMember").disabled = s === "rejected";
        $("pendingMember").disabled = s === "pending";
    }

    async function changeStatus(newStatus) {
        if (!currentMember) return;
        const label = newStatus === "Approved" ? "approve" : newStatus === "Rejected" ? "reject" : "return this member to pending";
        if (!window.confirm(`Are you sure you want to ${label} this membership?`)) return;
        const buttons = [$("approveMember"), $("rejectMember"), $("pendingMember")];
        buttons.forEach(b => b.disabled = true);
        setModalMessage("Updating membership status...");
        const { error } = await db.from("members").update({ membership_status: newStatus }).eq("id", currentMember.id);
        if (error) { console.error(error); setModalMessage(error.message || "Unable to update membership status."); updateActionButtons(currentMember.membership_status); return; }
        currentMember.membership_status = newStatus;
        $("modalMemberStatus").innerHTML = `<span class="status-badge ${statusClass(newStatus)}">${newStatus.toUpperCase()}</span>`;
        setModalMessage(`Membership status changed to ${newStatus.toUpperCase()}.`);
        updateActionButtons(newStatus);
        await loadMembers();
    }

    function closeModal() {
        $("memberModal").classList.remove("show");
        $("memberModal").setAttribute("aria-hidden", "true");
        currentMember = null;
    }

    document.addEventListener("DOMContentLoaded", async function () {
        try {
            const session = await requireAdmin();
            if (!session) return;
            await loadMembers();
        } catch (error) {
            console.error(error);
            setMessage(error.message || "Unable to load membership directory.");
        }

        $("memberSearch").addEventListener("input", () => { page = 0; loadMembers().catch(e => setMessage(e.message)); });
        ["statusFilter","ndcFilter","genderFilter"].forEach(id => $(id).addEventListener("change", () => { page = 0; loadMembers().catch(e => setMessage(e.message)); }));
        $("resetFilters").addEventListener("click", () => { $("memberSearch").value = ""; $("statusFilter").value = ""; $("ndcFilter").value = ""; $("genderFilter").value = ""; page = 0; loadMembers().catch(e => setMessage(e.message)); });
        $("previousPage").addEventListener("click", () => { if (page > 0) { page--; loadMembers().catch(e => setMessage(e.message)); } });
        $("nextPage").addEventListener("click", () => { if ((page + 1) * PAGE_SIZE < totalCount) { page++; loadMembers().catch(e => setMessage(e.message)); } });
        $("membersTableBody").addEventListener("click", event => { const button = event.target.closest("[data-member-id]"); if (button) openMember(button.dataset.memberId); });
        $("closeModal").addEventListener("click", closeModal);
        $("memberModal").addEventListener("click", event => { if (event.target === $("memberModal")) closeModal(); });
        document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
        $("approveMember").addEventListener("click", () => changeStatus("Approved"));
        $("rejectMember").addEventListener("click", () => changeStatus("Rejected"));
        $("pendingMember").addEventListener("click", () => changeStatus("Pending"));
        $("logoutButton").addEventListener("click", async () => { await db.auth.signOut(); window.location.href = "login.html"; });
    });
})();
