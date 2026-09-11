(function () {
    "use strict";

    const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    let hierarchy = null;
    let assignments = [];
    let members = [];
    let slots = [];
    let readinessRows = [];
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
        ["WARD_PILLAR", "Ward Pillar", 1],
        ["WARD_PILLAR", "Ward Pillar", 2],
        ["WARD_PILLAR", "Ward Pillar", 3],
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

    async function loadMembers() {
        members = [];
        let from = 0;
        const pageSize = 1000;
        while (true) {
            const to = from + pageSize - 1;
            const { data, error } = await db
                .from("members")
                .select("id,full_name,membership_status,lga,ward,polling_unit,polling_unit_code")
                .range(from, to);
            if (error) throw error;
            if (!Array.isArray(data) || data.length === 0) break;
            members.push(...data);
            if (data.length < pageSize) break;
            from += pageSize;
        }
    }

    function addSlot(scopeType, scopeKey, scopeName, roleCode, roleTitle, slotNumber) {
        slots.push({ scopeType, scopeKey, scopeName, roleCode, roleTitle, slotNumber });
    }

    function buildSlots() {
        slots = [];
        hierarchy.state.lgas.forEach(function (lga) {
            for (let i = 1; i <= 10; i++) addSlot("LGA", normalize(lga.name), lga.name, "OCHOUdo_PILLAR", "Mandate Pillar", i);
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

    function isActiveAssignment(a) {
        return !!a && normalize(a.status) === "ACTIVE" && !!a.full_name;
    }

    function countAssignments(scopeType, scopeKey, roleCodes) {
        const codes = Array.isArray(roleCodes) ? roleCodes.map(normalize) : [normalize(roleCodes)];
        return assignments.filter(a =>
            normalize(a.scope_type) === normalize(scopeType) &&
            normalize(a.scope_key) === normalize(scopeKey) &&
            codes.includes(normalize(a.role_code)) &&
            isActiveAssignment(a)
        ).length;
    }

    function buildReadinessRows() {
        readinessRows = hierarchy.state.lgas.map(function (lga) {
            const lgaKey = normalize(lga.name);
            const wards = lga.wards || [];
            const totalWards = wards.length;
            const totalPUs = wards.reduce((sum, w) => sum + (w.pollingUnits || []).length, 0);
            const pillarAssigned = countAssignments("LGA", lgaKey, "OCHOUdo_PILLAR");
            const lgaLeadershipCodes = LGA_FUNCTIONAL_ROLES.map(r => r[0]);
            const lgaLeadershipAssigned = countAssignments("LGA", lgaKey, lgaLeadershipCodes);
            let wardPillarAssigned = 0;
            wards.forEach(function (ward) {
                const wardKey = lgaKey + "||" + normalize(ward.name);
                wardPillarAssigned += countAssignments("WARD", wardKey, ["WARD_PILLAR"]);
            });
            const puCaptainAssigned = countAssignmentsByRoleInLga(lgaKey, "POLLING_UNIT_CAPTAIN");
            const connectorAssigned = countAssignmentsByRoleInLga(lgaKey, "POLLING_UNIT_CONNECTOR");

            const registeredMembers = members.filter(m => normalize(m.lga) === lgaKey);
            const approvedMembers = registeredMembers.filter(m => normalize(m.membership_status) === "APPROVED");
            const registeredPUs = new Set(registeredMembers.map(m => normalize(m.ward) + "||" + normalize(m.polling_unit)).filter(Boolean)).size;
            const verifiedPUs = new Set(approvedMembers.map(m => normalize(m.ward) + "||" + normalize(m.polling_unit)).filter(Boolean)).size;

            const layers = [
                pct(pillarAssigned, 10),
                pct(lgaLeadershipAssigned, LGA_FUNCTIONAL_ROLES.length),
                pct(wardPillarAssigned, totalWards * 3),
                pct(puCaptainAssigned, totalPUs),
                pct(connectorAssigned, totalPUs * 8)
            ];
            const score = Math.round(layers.reduce((a,b) => a+b, 0) / layers.length);
            const status = score >= 80 ? "READY" : score >= 50 ? "DEVELOPING" : score > 0 ? "STARTING" : "NOT READY";
            const assignedTotal = pillarAssigned + lgaLeadershipAssigned + wardPillarAssigned + puCaptainAssigned + connectorAssigned;
            const requiredTotal = 10 + LGA_FUNCTIONAL_ROLES.length + totalWards * 3 + totalPUs + totalPUs * 8;

            return {
                name: lga.name,
                lgaKey, totalWards, totalPUs,
                pillarAssigned, lgaLeadershipAssigned, wardPillarAssigned, puCaptainAssigned, connectorAssigned,
                assignedTotal, requiredTotal, gap: Math.max(0, requiredTotal - assignedTotal),
                score, status, registeredMembers: registeredMembers.length, approvedMembers: approvedMembers.length,
                registeredPUs, verifiedPUs
            };
        });
    }

    function countAssignmentsByRoleInLga(lgaKey, roleCode) {
        return assignments.filter(function (a) {
            if (normalize(a.role_code) !== normalize(roleCode) || !isActiveAssignment(a)) return false;
            return normalize(a.scope_key).startsWith(lgaKey + "||");
        }).length;
    }

    function pct(value, total) {
        if (!total) return 100;
        return Math.min(100, Math.round((value / total) * 100));
    }

    function renderReadiness() {
        const search = normalize($("readinessSearch").value);
        const statusFilter = $("readinessStatus").value;
        const sort = $("readinessSort").value;
        let rows = readinessRows.filter(r => (!search || normalize(r.name).includes(search)) && (!statusFilter || r.status === statusFilter));
        rows.sort(function(a,b) {
            if (sort === "score-asc") return a.score - b.score || a.name.localeCompare(b.name);
            if (sort === "gap-desc") return b.gap - a.gap || a.name.localeCompare(b.name);
            if (sort === "lga-asc") return a.name.localeCompare(b.name);
            return b.score - a.score || a.name.localeCompare(b.name);
        });
        $("readinessBody").innerHTML = rows.map(function(r) {
            const badgeClass = r.status === "READY" ? "readiness-ready" : r.status === "DEVELOPING" ? "readiness-developing" : r.status === "STARTING" ? "readiness-starting" : "readiness-none";
            return `<tr>
                <td class="readiness-lga">${esc(r.name)}</td>
                <td class="readiness-mini">${r.pillarAssigned}/10</td>
                <td class="readiness-mini">${r.lgaLeadershipAssigned}/${LGA_FUNCTIONAL_ROLES.length}</td>
                <td class="readiness-mini">${r.wardPillarAssigned}/${r.totalWards * 3}</td>
                <td class="readiness-mini">${r.puCaptainAssigned}/${r.totalPUs}</td>
                <td class="readiness-mini">${r.connectorAssigned}/${r.totalPUs * 8}</td>
                <td><span class="readiness-bar"><i style="width:${r.score}%"></i></span><span class="readiness-percent">${r.score}%</span></td>
                <td><span class="readiness-badge ${badgeClass}">${r.status}</span></td>
                <td class="readiness-mini">${r.registeredMembers} reg / ${r.approvedMembers} approved</td>
            </tr>`;
        }).join("") || '<tr><td colspan="9">No LGAs match the selected filters.</td></tr>';

        const average = readinessRows.length ? Math.round(readinessRows.reduce((sum,r) => sum + r.score, 0) / readinessRows.length) : 0;
        const ready = readinessRows.filter(r => r.status === "READY").length;
        const developing = readinessRows.filter(r => r.status === "DEVELOPING").length;
        const starting = readinessRows.filter(r => r.status === "STARTING").length;
        const none = readinessRows.filter(r => r.status === "NOT READY").length;
        const gaps = readinessRows.reduce((sum,r) => sum + r.gap, 0);
        $("stateReadinessScore").textContent = `${average}%`;
        $("stateReadinessText").textContent = `${readinessRows.filter(r => r.score > 0).length} of 27 LGAs have at least one command position assigned.`;
        $("readyLgas").textContent = ready;
        $("developingLgas").textContent = developing;
        $("startingLgas").textContent = starting;
        $("notReadyLgas").textContent = none;
        $("stateCommandGaps").textContent = gaps.toLocaleString();
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
        const lgaPillars = slots.filter(s => s.scopeType === "LGA" && s.roleCode === "OCHOUdo_PILLAR").length;
        const lgaCaptains = slots.filter(s => s.scopeType === "LGA" && s.roleCode === "MANDATE_CAPTAIN").length;
        const wardPillars = slots.filter(s => s.scopeType === "WARD" && s.roleCode === "WARD_PILLAR").length;
        const puCaptains = slots.filter(s => s.roleCode === "POLLING_UNIT_CAPTAIN").length;
        const puConnectors = slots.filter(s => s.roleCode === "POLLING_UNIT_CONNECTOR").length;
        $("lgaPillarSlots").textContent = `${assignedLga(lgaPillars, "OCHOUdo_PILLAR")} / ${lgaPillars}`;
        $("lgaCaptainSlots").textContent = `${assignedLga(lgaCaptains, "MANDATE_CAPTAIN")} / ${lgaCaptains}`;
        $("wardPillarSlots").textContent = `${assignedRole(wardPillars, "WARD_PILLAR")} / ${wardPillars}`;
        $("puCaptainSlots").textContent = `${assignedRole(puCaptains, "POLLING_UNIT_CAPTAIN")} / ${puCaptains}`;
        $("puConnectorSlots").textContent = `${assignedRole(puConnectors, "POLLING_UNIT_CONNECTOR")} / ${puConnectors}`;
        setMessage(`${assigned.toLocaleString()} command positions currently assigned out of ${slots.length.toLocaleString()} defined positions.`);
        buildReadinessRows();
        renderReadiness();
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
            await loadHierarchy(); await loadAssignments(); await loadMembers(); buildSlots(); render();
            $("commandSearch").addEventListener("input", render);
            $("commandLevel").addEventListener("change", render);
            $("commandStatus").addEventListener("change", render);
            $("readinessSearch").addEventListener("input", renderReadiness);
            $("readinessStatus").addEventListener("change", renderReadiness);
            $("readinessSort").addEventListener("change", renderReadiness);
            $("commandCancel").addEventListener("click", closeModal);
            $("commandForm").addEventListener("submit", saveAssignment);
            $("commandModal").addEventListener("click", e => { if (e.target === $("commandModal")) closeModal(); });
        } catch (error) { console.error(error); setMessage(error.message || "Unable to load command centre."); }
    }

    document.addEventListener("DOMContentLoaded", start);
})();
