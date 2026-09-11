(function () {
    "use strict";

    const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    let hierarchy = null;
    let assignments = [];
    let slots = [];
    let currentSlot = null;

    const $ = (id) => document.getElementById(id);
    const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
    const esc = (value) => String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    const LGA_FUNCTIONAL_ROLES = [
        ["MANDATE_CAPTAIN", "Mandate Captain", 1],
        ["DEPUTY_MANDATE_CAPTAIN", "Deputy Mandate Captain", 1],
        ["SECRETARY", "Secretary", 1],
        ["ASSISTANT_SECRETARY", "Assistant Secretary", 1],
        ["PUBLICITY_SECRETARY", "Publicity Secretary", 1],
        ["NEW_MEDIA_DIRECTOR", "New Media Director", 1],
        ["WOMEN_LEADER", "Women Leader", 1],
        ["YOUTH_LEADER", "Youth Leader", 1],
        ["FINANCIAL_SECRETARY", "Financial Secretary", 1],
        ["TREASURER", "Treasurer", 1],
        ["WELFARE_OFFICER", "Welfare Officer", 1]
    ];

    const WARD_ROLES = [
        ["WARD_MANDATE_PILLAR", "Ward Pillar", 1],
        ["WARD_MANDATE_PILLAR", "Ward Pillar", 2],
        ["WARD_MANDATE_PILLAR", "Ward Pillar", 3],
        ["WARD_MANDATE_CAPTAIN", "Ward Mandate Captain", 1],
        ["WARD_DEPUTY_MANDATE_CAPTAIN", "Ward Deputy Mandate Captain", 1],
        ["SECRETARY", "Secretary", 1],
        ["ASSISTANT_SECRETARY", "Assistant Secretary", 1],
        ["PUBLICITY_SECRETARY", "Publicity Secretary", 1],
        ["NEW_MEDIA_DIRECTOR", "New Media Director", 1],
        ["WOMEN_LEADER", "Women Leader", 1],
        ["YOUTH_LEADER", "Youth Leader", 1],
        ["FINANCIAL_SECRETARY", "Financial Secretary", 1],
        ["TREASURER", "Treasurer", 1],
        ["WELFARE_OFFICER", "Welfare Officer", 1]
    ];

    function setMessage(text) { $("commandMessage").textContent = text; }

    async function requireAdmin() {
        const { data, error } = await db.auth.getSession();
        if (error) throw error;
        if (!data.session) { window.location.href = "login.html"; return false; }
        const { data: allowed, error: adminError } = await db.rpc("is_omg_admin");
        if (adminError) throw adminError;
        if (allowed !== true) { await db.auth.signOut(); window.location.href = "login.html"; return false; }
        return true;
    }

    async function loadHierarchy() {
        const response = await fetch("../data/imo.json", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load Imo electoral hierarchy.");
        const json = await response.json();
        if (!json || !json.state || !Array.isArray(json.state.lgas)) throw new Error("Invalid electoral hierarchy.");
        hierarchy = json;
    }

    async function loadAssignments() {
        const { data, error } = await db.rpc("get_omg_command_assignments");
        if (error) throw error;
        assignments = Array.isArray(data) ? data : [];
    }

    function addSlot(scopeType, scopeKey, scopeName, roleCode, roleTitle, slotNumber) {
        slots.push({ scopeType, scopeKey, scopeName, roleCode, roleTitle, slotNumber });
    }

    function buildSlots() {
        slots = [];
        hierarchy.state.lgas.forEach(function (lga) {
            for (let i = 1; i <= 10; i++) addSlot("LGA", normalize(lga.name), lga.name, "MANDATE_PILLAR", "Mandate Pillar", i);
            LGA_FUNCTIONAL_ROLES.forEach(r => addSlot("LGA", normalize(lga.name), lga.name, r[0], r[1], r[2]));
            (lga.wards || []).forEach(function (ward) {
                WARD_ROLES.forEach(r => addSlot("WARD", normalize(lga.name) + "||" + normalize(ward.name), lga.name + " • " + ward.name, r[0], r[1], r[2]));
                (ward.pollingUnits || []).forEach(function (unit) {
                    addSlot("POLLING_UNIT", normalize(lga.name) + "||" + normalize(ward.name) + "||" + normalize(unit.name), lga.name + " • " + ward.name + " • " + unit.name, "POLLING_UNIT_CAPTAIN", "Polling Unit Captain", 1);
                    for (let i = 1; i <= 8; i++) addSlot("POLLING_UNIT", normalize(lga.name) + "||" + normalize(ward.name) + "||" + normalize(unit.name), lga.name + " • " + ward.name + " • " + unit.name, "POLLING_UNIT_CONNECTOR", "Polling Unit Connector", i);
                });
            });
        });
    }

    function findAssignment(slot) {
        return assignments.find(a => normalize(a.scope_type) === slot.scopeType && normalize(a.scope_key) === normalize(slot.scopeKey) && normalize(a.role_code) === normalize(slot.roleCode) && Number(a.slot_number) === Number(slot.slotNumber));
    }

    function filteredSlots() {
        const search = normalize($("commandSearch").value);
        const level = $("commandLevel").value;
        const status = $("commandStatus").value;
        return slots.filter(function (slot) {
            const assignment = findAssignment(slot);
            const assigned = !!assignment && normalize(assignment.status) === "ACTIVE" && !!assignment.full_name;
            if (level && slot.scopeType !== level) return false;
            if (status === "ASSIGNED" && !assigned) return false;
            if (status === "VACANT" && assigned) return false;
            if (search) {
                const haystack = normalize(slot.scopeName + " " + slot.roleTitle + " " + (assignment ? assignment.full_name : ""));
                if (!haystack.includes(search)) return false;
            }
            return true;
        });
    }

    function render() {
        const rows = filteredSlots();
        $("commandBody").innerHTML = rows.slice(0, 500).map(function (slot) {
            const assignment = findAssignment(slot);
            const assigned = !!assignment && normalize(assignment.status) === "ACTIVE" && !!assignment.full_name;
            return `<tr>
                <td>${esc(slot.scopeType.replace("_", " "))}</td>
                <td class="command-scope">${esc(slot.scopeName)}</td>
                <td class="command-role">${esc(slot.roleTitle)}</td>
                <td>${slot.slotNumber}</td>
                <td>${assigned ? esc(assignment.full_name) : '<span class="command-vacant">VACANT</span>'}</td>
                <td class="${assigned ? 'command-assigned' : 'command-vacant'}">${assigned ? 'ASSIGNED' : 'VACANT'}</td>
                <td>${assigned ? `<button class="assign-button remove" data-remove="${esc(assignment.id)}">REMOVE</button>` : `<button class="assign-button" data-assign="${esc(JSON.stringify(slot))}">ASSIGN</button>`}</td>
            </tr>`;
        }).join("") || '<tr><td colspan="7">No command slots match the selected filters.</td></tr>';

        $("commandBody").querySelectorAll("[data-assign]").forEach(function (button) {
            button.addEventListener("click", function () { openModal(JSON.parse(button.dataset.assign)); });
        });
        $("commandBody").querySelectorAll("[data-remove]").forEach(function (button) {
            button.addEventListener("click", function () { removeAssignment(button.dataset.remove); });
        });

        const assigned = slots.filter(s => !!findAssignment(s) && normalize(findAssignment(s).status) === "ACTIVE").length;
        const lgaPillars = slots.filter(s => s.scopeType === "LGA" && s.roleCode === "MANDATE_PILLAR").length;
        const lgaCaptains = slots.filter(s => s.scopeType === "LGA" && s.roleCode === "MANDATE_CAPTAIN").length;
        const wardPillars = slots.filter(s => s.scopeType === "WARD" && s.roleCode === "WARD_MANDATE_PILLAR").length;
        const puCaptains = slots.filter(s => s.roleCode === "POLLING_UNIT_CAPTAIN").length;
        const puConnectors = slots.filter(s => s.roleCode === "POLLING_UNIT_CONNECTOR").length;
        $("lgaPillarSlots").textContent = `${assignedLga(lgaPillars, "MANDATE_PILLAR")} / ${lgaPillars}`;
        $("lgaCaptainSlots").textContent = `${assignedLga(lgaCaptains, "MANDATE_CAPTAIN")} / ${lgaCaptains}`;
        $("wardPillarSlots").textContent = `${assignedRole(wardPillars, "WARD_MANDATE_PILLAR")} / ${wardPillars}`;
        $("puCaptainSlots").textContent = `${assignedRole(puCaptains, "POLLING_UNIT_CAPTAIN")} / ${puCaptains}`;
        $("puConnectorSlots").textContent = `${assignedRole(puConnectors, "POLLING_UNIT_CONNECTOR")} / ${puConnectors}`;
        setMessage(`${assigned.toLocaleString()} command positions currently assigned out of ${slots.length.toLocaleString()} defined positions.`);
    }

    function assignedLga(total, role) { return slots.filter(s => s.scopeType === "LGA" && s.roleCode === role && findAssignment(s)).length; }
    function assignedRole(total, role) { return slots.filter(s => s.roleCode === role && findAssignment(s)).length; }

    function openModal(slot) {
        currentSlot = slot;
        const existing = findAssignment(slot);
        $("commandModalTitle").textContent = existing ? "Edit Command Officer" : "Assign Command Officer";
        $("commandModalScope").textContent = `${slot.scopeType.replace("_", " ")} • ${slot.scopeName} • ${slot.roleTitle} • Slot ${slot.slotNumber}`;
        $("commandName").value = existing ? existing.full_name || "" : "";
        $("commandPhone").value = existing ? existing.phone || "" : "";
        $("commandEmail").value = existing ? existing.email || "" : "";
        $("commandNotes").value = existing ? existing.notes || "" : "";
        $("commandModal").hidden = false;
        $("commandName").focus();
    }

    function closeModal() { $("commandModal").hidden = true; currentSlot = null; $("commandForm").reset(); }

    async function saveAssignment(event) {
        event.preventDefault();
        if (!currentSlot) return;
        const button = $("commandSave"); button.disabled = true; button.textContent = "SAVING...";
        try {
            const { data, error } = await db.rpc("save_omg_command_assignment", {
                p_scope_type: currentSlot.scopeType,
                p_scope_key: currentSlot.scopeKey,
                p_scope_name: currentSlot.scopeName,
                p_role_code: currentSlot.roleCode,
                p_role_title: currentSlot.roleTitle,
                p_slot_number: currentSlot.slotNumber,
                p_full_name: $("commandName").value,
                p_phone: $("commandPhone").value,
                p_email: $("commandEmail").value,
                p_notes: $("commandNotes").value
            });
            if (error) throw error;
            assignments = assignments.filter(a => !(normalize(a.scope_type) === currentSlot.scopeType && normalize(a.scope_key) === normalize(currentSlot.scopeKey) && normalize(a.role_code) === normalize(currentSlot.roleCode) && Number(a.slot_number) === Number(currentSlot.slotNumber)));
            assignments.push(data);
            closeModal(); render();
        } catch (error) { alert(error.message || "Unable to save assignment."); }
        finally { button.disabled = false; button.textContent = "SAVE ASSIGNMENT"; }
    }

    async function removeAssignment(id) {
        if (!confirm("Remove this command assignment? The position will become vacant.")) return;
        const { error } = await db.rpc("remove_omg_command_assignment", { p_id: id });
        if (error) { alert(error.message || "Unable to remove assignment."); return; }
        assignments = assignments.filter(a => a.id !== id); render();
    }

    async function start() {
        try {
            const ok = await requireAdmin(); if (!ok) return;
            await loadHierarchy(); await loadAssignments(); buildSlots(); render();
            $("commandSearch").addEventListener("input", render);
            $("commandLevel").addEventListener("change", render);
            $("commandStatus").addEventListener("change", render);
            $("commandCancel").addEventListener("click", closeModal);
            $("commandForm").addEventListener("submit", saveAssignment);
            $("commandModal").addEventListener("click", e => { if (e.target === $("commandModal")) closeModal(); });
        } catch (error) { console.error(error); setMessage(error.message || "Unable to load command centre."); }
    }

    document.addEventListener("DOMContentLoaded", start);
})();
