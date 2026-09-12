(function () {
    "use strict";

// OMG Command Centre version marker and cache-busting diagnostic.
window.OMG_COMMAND_VERSION = "PHASE-3D-FINAL-FIX1";
console.log("OMG Command Centre PHASE-3D-FINAL-FIX1 loaded");

    const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    let hierarchy = null;
    let assignments = [];
    let members = [];
    let slots = [];
    let readinessRows = [];
    let activities = [];
    let currentSlot = null;
    let currentProfileLga = null;
    let wardReadinessRows = [];
    let currentProfileWard = null;
    let puReadinessRows = [];
    let currentProfilePu = null;

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
            const approvedMemberCount = approvedMembers.length;
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
                score, status, registeredMembers: registeredMembers.length, approvedMemberCount,
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

    function getLgaProfile(lgaKey) {
        const row = readinessRows.find(r => r.lgaKey === lgaKey);
        if (!row) return null;
        const lga = hierarchy.state.lgas.find(x => normalize(x.name) === lgaKey);
        const wards = lga ? (lga.wards || []) : [];
        const lgaAssignments = assignments.filter(a => {
            if (!isActiveAssignment(a)) return false;
            const scope = normalize(a.scope_type);
            if (scope === "LGA") return normalize(a.scope_key) === lgaKey;
            return scope === "WARD" || scope === "POLLING_UNIT" ? normalize(a.scope_key).startsWith(lgaKey + "||") : false;
        });
        const lgaLeadership = lgaAssignments.filter(a => normalize(a.scope_type) === "LGA" && normalize(a.role_code) !== "OCHOUdo_PILLAR");
        const lgaPillars = lgaAssignments.filter(a => normalize(a.scope_type) === "LGA" && normalize(a.role_code) === "OCHOUdo_PILLAR");
        const wardPillars = lgaAssignments.filter(a => normalize(a.role_code) === "WARD_PILLAR");
        const puCaptains = lgaAssignments.filter(a => normalize(a.role_code) === "POLLING_UNIT_CAPTAIN");
        const connectors = lgaAssignments.filter(a => normalize(a.role_code) === "POLLING_UNIT_CONNECTOR");
        const lgaMembers = members.filter(m => normalize(m.lga) === lgaKey);
        const approvedMemberRecords = lgaMembers.filter(m => normalize(m.membership_status) === "APPROVED");
        const approvedMemberCount = approvedMemberRecords.length;
        const registeredPuKeys = new Set(lgaMembers.map(m => normalize(m.ward) + "||" + normalize(m.polling_unit)));
        const approvedPuKeys = new Set(approvedMemberRecords.map(m => normalize(m.ward) + "||" + normalize(m.polling_unit)));
        const uncoveredPus = [];
        const pendingOnlyPus = [];
        const rejectedOnlyPus = [];
        const memberByPu = new Map();
        lgaMembers.forEach(m => {
            const key = normalize(m.ward) + "||" + normalize(m.polling_unit);
            if (!key || key === "||") return;
            if (!memberByPu.has(key)) memberByPu.set(key, []);
            memberByPu.get(key).push(m);
        });
        wards.forEach(w => (w.pollingUnits || []).forEach(u => {
            const key = normalize(w.name) + "||" + normalize(u.name);
            const puMembers = memberByPu.get(key) || [];
            if (!puMembers.length) uncoveredPus.push({ ward: w.name, name: u.name, code: u.delimitation || "" });
            else if (!puMembers.some(m => normalize(m.membership_status) === "APPROVED") && puMembers.some(m => normalize(m.membership_status) === "PENDING")) pendingOnlyPus.push({ ward: w.name, name: u.name, code: u.delimitation || "" });
            else if (!puMembers.some(m => normalize(m.membership_status) === "APPROVED") && puMembers.every(m => normalize(m.membership_status) === "REJECTED")) rejectedOnlyPus.push({ ward: w.name, name: u.name, code: u.delimitation || "" });
        }));
        const recentActivities = activities.filter(a => normalize(a.lga_name) === lgaKey && isRecentActivity(a));
        const wardDetails = wards.map(w => {
            const wardKey = normalize(w.name);
            const puCount = (w.pollingUnits || []).length;
            const wardPillarCount = lgaAssignments.filter(a => normalize(a.scope_type) === "WARD" && normalize(a.scope_key) === lgaKey + "||" + wardKey && normalize(a.role_code) === "WARD_PILLAR").length;
            const captainCount = lgaAssignments.filter(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key).startsWith(lgaKey + "||" + wardKey + "||") && normalize(a.role_code) === "POLLING_UNIT_CAPTAIN").length;
            const connectorCount = lgaAssignments.filter(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key).startsWith(lgaKey + "||" + wardKey + "||") && normalize(a.role_code) === "POLLING_UNIT_CONNECTOR").length;
            const approvedPuCount = new Set(lgaMembers.filter(m => normalize(m.ward) === wardKey && normalize(m.membership_status) === "APPROVED").map(m => normalize(m.polling_unit))).size;
            return { name:w.name, puCount, wardPillarCount, captainCount, connectorCount, approvedPuCount };
        });
        return { ...row, lga, wards, lgaAssignments, lgaLeadership, lgaPillars, wardPillars, puCaptains, connectors, lgaMembers, approvedMemberRecords, approvedMemberCount, uncoveredPus, pendingOnlyPus, rejectedOnlyPus, recentActivities, wardDetails, registeredPuKeys, approvedPuKeys };
    }

    function openLgaProfile(lgaKey) {
        const profile = getLgaProfile(lgaKey);
        if (!profile) return;
        currentProfileLga = profile;
        $("profileLgaName").textContent = profile.name;
        $("profileHealthScore").textContent = `${profile.score}%`;
        $("profileHealthStatus").textContent = profile.status;
        $("profileCommandScore").textContent = `${profile.score}%`;
        $("profileRegisteredMembers").textContent = profile.registeredMembers.toLocaleString();
        const rawApprovedCount = profile.approvedMemberCount;
        const approvedCount = Number.isFinite(Number(rawApprovedCount))
            ? Number(rawApprovedCount)
            : (Array.isArray(profile.approvedMemberRecords) ? profile.approvedMemberRecords.length : 0);
        const approvedCountEl = $("profileApprovedMemberCount");
        if (approvedCountEl) approvedCountEl.textContent = String(approvedCount);
        $("profileRegisteredPus").textContent = profile.registeredPUs.toLocaleString();
        $("profileVerifiedPus").textContent = profile.verifiedPUs.toLocaleString();
        $("profilePillars").textContent = `${profile.pillarAssigned}/10`;
        $("profileLeadership").textContent = `${profile.lgaLeadershipAssigned}/${LGA_FUNCTIONAL_ROLES.length}`;
        $("profileWardPillars").textContent = `${profile.wardPillarAssigned}/${profile.totalWards * 3}`;
        $("profilePuCaptains").textContent = `${profile.puCaptainAssigned}/${profile.totalPUs}`;
        $("profileConnectors").textContent = `${profile.connectorAssigned}/${profile.totalPUs * 8}`;
        $("profileActivityCount").textContent = profile.recentActivities.length.toLocaleString();
        const latest = profile.recentActivities.slice().sort((a,b)=>String(b.activity_date).localeCompare(String(a.activity_date)))[0];
        $("profileLatestActivity").textContent = latest ? latest.activity_date : "None recorded";
        $("profileUncoveredPus").textContent = profile.uncoveredPus.length.toLocaleString();
        $("profilePendingPus").textContent = profile.pendingOnlyPus.length.toLocaleString();
        $("profileRejectedPus").textContent = profile.rejectedOnlyPus.length.toLocaleString();
        const priority = [];
        if (profile.pillarAssigned < 10) priority.push(`Fill ${10 - profile.pillarAssigned} remaining Mandate Pillar position${10-profile.pillarAssigned===1?'':'s'}.`);
        if (profile.lgaLeadershipAssigned < LGA_FUNCTIONAL_ROLES.length) priority.push(`Complete ${LGA_FUNCTIONAL_ROLES.length - profile.lgaLeadershipAssigned} remaining LGA leadership position${LGA_FUNCTIONAL_ROLES.length-profile.lgaLeadershipAssigned===1?'':'s'}.`);
        if (profile.wardPillarAssigned < profile.totalWards * 3) priority.push(`Establish ${profile.totalWards * 3 - profile.wardPillarAssigned} remaining Ward Pillar position${profile.totalWards*3-profile.wardPillarAssigned===1?'':'s'}.`);
        if (profile.puCaptainAssigned < profile.totalPUs) priority.push(`Assign ${profile.totalPUs - profile.puCaptainAssigned} remaining Polling Unit Captain${profile.totalPUs-profile.puCaptainAssigned===1?'':'s'}.`);
        if (profile.connectorAssigned < profile.totalPUs * 8) priority.push(`Build the remaining ${profile.totalPUs * 8 - profile.connectorAssigned} connector slot${profile.totalPUs*8-profile.connectorAssigned===1?'':'s'}.`);
        if (profile.verifiedPUs < profile.totalPUs) priority.push(`Expand approved membership coverage across ${profile.totalPUs - profile.verifiedPUs} uncovered polling unit${profile.totalPUs-profile.verifiedPUs===1?'':'s'}.`);
        if (!profile.recentActivities.length) priority.push("Record a recent organisational activity to establish an operational activity baseline.");
        $("profilePriorityList").innerHTML = priority.slice(0,6).map(x=>`<li>${esc(x)}</li>`).join("") || "<li>No immediate priority gaps identified.</li>";
        $("profileWardBody").innerHTML = profile.wardDetails.map(w=>`<tr><td>${esc(w.name)}</td><td>${w.wardPillarCount}/3</td><td>${w.approvedPuCount}/${w.puCount}</td><td>${w.captainCount}/${w.puCount}</td><td>${w.connectorCount}/${w.puCount*8}</td></tr>`).join("") || '<tr><td colspan="5">No ward data available.</td></tr>';
        $("profileModal").hidden = false;
    }

    function closeProfile() { $("profileModal").hidden = true; currentProfileLga = null; }

    function getWardLeadershipSlots(lgaName, wardName) {
        const lgaKey = normalize(lgaName);
        const wardKey = lgaKey + "||" + normalize(wardName);
        return WARD_ROLES.filter(r => normalize(r[0]) !== "WARD_PILLAR").map(r => ({
            roleCode: r[0], roleTitle: r[1], slotNumber: r[2],
            assignment: assignments.find(a => normalize(a.scope_type) === "WARD" && normalize(a.scope_key) === wardKey && normalize(a.role_code) === normalize(r[0]) && Number(a.slot_number) === Number(r[2]) && isActiveAssignment(a)) || null
        }));
    }

    function buildWardReadinessRows() {
        wardReadinessRows = [];
        hierarchy.state.lgas.forEach(function(lga) {
            const lgaKey = normalize(lga.name);
            (lga.wards || []).forEach(function(ward) {
                const wardKey = lgaKey + "||" + normalize(ward.name);
                const pus = ward.pollingUnits || [];
                const totalPUs = pus.length;
                const pillarAssigned = countAssignments("WARD", wardKey, "WARD_PILLAR");
                const leadershipCodes = WARD_ROLES.filter(r => normalize(r[0]) !== "WARD_PILLAR").map(r => r[0]);
                const leadershipAssigned = countAssignments("WARD", wardKey, leadershipCodes);
                const puCaptainAssigned = assignments.filter(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key).startsWith(wardKey + "||") && normalize(a.role_code) === "POLLING_UNIT_CAPTAIN" && isActiveAssignment(a)).length;
                const connectorAssigned = assignments.filter(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key).startsWith(wardKey + "||") && normalize(a.role_code) === "POLLING_UNIT_CONNECTOR" && isActiveAssignment(a)).length;
                const wardMembers = members.filter(m => normalize(m.lga) === lgaKey && normalize(m.ward) === normalize(ward.name));
                const approvedMembers = wardMembers.filter(m => normalize(m.membership_status) === "APPROVED");
                const registeredPUs = new Set(wardMembers.map(m => normalize(m.polling_unit)).filter(Boolean)).size;
                const verifiedPUs = new Set(approvedMembers.map(m => normalize(m.polling_unit)).filter(Boolean)).size;
                const layers = [pct(pillarAssigned, 3), pct(leadershipAssigned, 11), pct(puCaptainAssigned, totalPUs), pct(connectorAssigned, totalPUs * 8), pct(verifiedPUs, totalPUs)];
                const score = Math.round(layers.reduce((a,b) => a+b, 0) / layers.length);
                const status = score >= 80 ? "READY" : score >= 50 ? "DEVELOPING" : score > 0 ? "STARTING" : "NOT READY";
                const assignedTotal = pillarAssigned + leadershipAssigned + puCaptainAssigned + connectorAssigned;
                const requiredTotal = 3 + 11 + totalPUs + totalPUs * 8;
                const recentActivities = activities.filter(a => normalize(a.lga_name) === lgaKey && normalize(a.ward_name) === normalize(ward.name) && isRecentActivity(a));
                wardReadinessRows.push({ lgaName:lga.name, lgaKey, wardName:ward.name, wardKey, totalPUs, pillarAssigned, leadershipAssigned, puCaptainAssigned, connectorAssigned, registeredMembers:wardMembers.length, approvedMembers:approvedMembers.length, registeredPUs, verifiedPUs, recentActivities:recentActivities.length, score, status, gap:Math.max(0, requiredTotal-assignedTotal) });
            });
        });
    }

    function getWardProfile(wardKey) {
        const row = wardReadinessRows.find(r => r.wardKey === wardKey);
        if (!row) return null;
        const lga = hierarchy.state.lgas.find(x => normalize(x.name) === row.lgaKey);
        const ward = lga ? (lga.wards || []).find(x => normalize(x.name) === normalize(row.wardName)) : null;
        const pus = ward ? (ward.pollingUnits || []) : [];
        const wardMembers = members.filter(m => normalize(m.lga) === row.lgaKey && normalize(m.ward) === normalize(row.wardName));
        const approvedMembers = wardMembers.filter(m => normalize(m.membership_status) === "APPROVED");
        const leadership = getWardLeadershipSlots(row.lgaName, row.wardName);
        const pillarSlots = [1,2,3].map(n => assignments.find(a => normalize(a.scope_type) === "WARD" && normalize(a.scope_key) === row.wardKey && normalize(a.role_code) === "WARD_PILLAR" && Number(a.slot_number) === n && isActiveAssignment(a)) || null);
        const puDetails = pus.map(u => {
            const puKey = row.wardKey + "||" + normalize(u.name);
            const captain = assignments.find(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key) === puKey && normalize(a.role_code) === "POLLING_UNIT_CAPTAIN" && isActiveAssignment(a));
            const connectorCount = assignments.filter(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key) === puKey && normalize(a.role_code) === "POLLING_UNIT_CONNECTOR" && isActiveAssignment(a)).length;
            const puMembers = wardMembers.filter(m => normalize(m.polling_unit) === normalize(u.name));
            const verified = puMembers.some(m => normalize(m.membership_status) === "APPROVED");
            const puActivities = activities.filter(a => normalize(a.lga_name) === row.lgaKey && normalize(a.ward_name) === normalize(row.wardName) && normalize(a.polling_unit_name) === normalize(u.name) && isRecentActivity(a)).length;
            return {name:u.name, code:u.delimitation || "", verified, captain:captain ? captain.full_name : "VACANT", connectorCount, puActivities};
        });
        const recentActivities = activities.filter(a => normalize(a.lga_name) === row.lgaKey && normalize(a.ward_name) === normalize(row.wardName) && isRecentActivity(a));
        return {...row, lga, ward, wardMembers, approvedMembers, leadership, pillarSlots, puDetails, recentActivities};
    }

    function openWardProfile(wardKey) {
        const profile = getWardProfile(wardKey);
        if (!profile) return;
        currentProfileWard = profile;
        $("wardProfileName").textContent = profile.wardName;
        $("wardProfileStatus").textContent = profile.status;
        $("wardProfileLocation").textContent = `${profile.lgaName} • Detailed command, membership, activity and polling-unit picture for this ward.`;
        $("wardProfileScore").textContent = `${profile.score}%`;
        $("wardProfileScoreText").textContent = `${profile.score}% overall ward readiness`;
        $("wardProfileRegisteredMembers").textContent = profile.registeredMembers.toLocaleString();
        $("wardProfileApprovedMembers").textContent = profile.approvedMembers.length.toLocaleString();
        $("wardProfileRegisteredPus").textContent = profile.registeredPUs.toLocaleString();
        $("wardProfileVerifiedPus").textContent = profile.verifiedPUs.toLocaleString();
        $("wardProfilePillars").textContent = `${profile.pillarAssigned}/3`;
        $("wardProfileLeadership").textContent = `${profile.leadershipAssigned}/11`;
        $("wardProfilePuCaptains").textContent = `${profile.puCaptainAssigned}/${profile.totalPUs}`;
        $("wardProfileConnectors").textContent = `${profile.connectorAssigned}/${profile.totalPUs * 8}`;
        const leadershipItems = [...profile.pillarSlots.map((a,i)=>({title:`Ward Pillar ${i+1}`,name:a ? a.full_name : "VACANT"})), ...profile.leadership.map(x=>({title:x.roleTitle,name:x.assignment ? x.assignment.full_name : "VACANT"}))];
        $("wardLeadershipList").innerHTML = leadershipItems.map(x=>`<div class="ward-profile-item"><span>${esc(x.title)}</span><strong class="${x.name === "VACANT" ? "vacant" : ""}">${esc(x.name)}</strong></div>`).join("");
        $("wardProfileActivityCount").textContent = profile.recentActivities.length.toLocaleString();
        const latest = profile.recentActivities.slice().sort((a,b)=>String(b.activity_date).localeCompare(String(a.activity_date)))[0];
        $("wardProfileLatestActivity").textContent = latest ? latest.activity_date : "None recorded";
        const priority=[];
        if(profile.pillarAssigned<3) priority.push(`Fill ${3-profile.pillarAssigned} remaining Ward Pillar position${3-profile.pillarAssigned===1?'':'s'}.`);
        if(profile.leadershipAssigned<11) priority.push(`Complete ${11-profile.leadershipAssigned} remaining Ward leadership position${11-profile.leadershipAssigned===1?'':'s'}.`);
        if(profile.puCaptainAssigned<profile.totalPUs) priority.push(`Assign ${profile.totalPUs-profile.puCaptainAssigned} remaining Polling Unit Captain${profile.totalPUs-profile.puCaptainAssigned===1?'':'s'}.`);
        if(profile.connectorAssigned<profile.totalPUs*8) priority.push(`Build the remaining ${profile.totalPUs*8-profile.connectorAssigned} connector slot${profile.totalPUs*8-profile.connectorAssigned===1?'':'s'}.`);
        if(profile.verifiedPUs<profile.totalPUs) priority.push(`Expand approved membership coverage across ${profile.totalPUs-profile.verifiedPUs} uncovered polling unit${profile.totalPUs-profile.verifiedPUs===1?'':'s'}.`);
        if(!profile.recentActivities.length) priority.push("Record a recent ward activity to establish an operational baseline.");
        $("wardProfilePriorityList").innerHTML = priority.slice(0,6).map(x=>`<li>${esc(x)}</li>`).join("") || "<li>No immediate priority gaps identified.</li>";
        $("wardProfilePuBody").innerHTML = profile.puDetails.map(u=>{ const puKey = profile.wardKey + "||" + normalize(u.name); return `<tr><td>${esc(u.name)}</td><td>${esc(u.code || "-")}</td><td>${u.verified ? "VERIFIED" : "NOT VERIFIED"}</td><td class="${u.captain === "VACANT" ? "command-vacant" : "command-assigned"}">${esc(u.captain)}</td><td>${u.connectorCount}/8</td><td>${u.puActivities}</td><td><button class="profile-button" data-pu-profile="${esc(puKey)}">VIEW PROFILE</button></td></tr>`; }).join("") || '<tr><td colspan="7">No polling units available.</td></tr>';
        $("wardProfilePuBody").querySelectorAll("[data-pu-profile]").forEach(btn=>btn.addEventListener("click",()=>openPuProfile(btn.dataset.puProfile)));
        $("wardProfileModal").hidden=false;
    }

    function closeWardProfile(){ $("wardProfileModal").hidden=true; currentProfileWard=null; }

    function renderWardReadiness(){
        const search=normalize($("wardSearch").value); const statusFilter=$("wardStatus").value; const sort=$("wardSort").value;
        let rows=wardReadinessRows.filter(r=>(!search || normalize(r.wardName+" "+r.lgaName).includes(search)) && (!statusFilter || r.status===statusFilter));
        rows.sort(function(a,b){
            if(sort==="score-asc") return a.score-b.score || a.lgaName.localeCompare(b.lgaName) || a.wardName.localeCompare(b.wardName);
            if(sort==="gap-desc") return b.gap-a.gap || a.lgaName.localeCompare(b.lgaName);
            if(sort==="ward-asc") return a.wardName.localeCompare(b.wardName) || a.lgaName.localeCompare(b.lgaName);
            return b.score-a.score || a.lgaName.localeCompare(b.lgaName) || a.wardName.localeCompare(b.wardName);
        });
        $("wardBody").innerHTML=rows.map(r=>{const badgeClass=r.status==="READY"?"ward-ready":r.status==="DEVELOPING"?"ward-developing":r.status==="STARTING"?"ward-starting":"ward-none"; return `<tr><td class="ward-mini">${esc(r.lgaName)}</td><td class="ward-name">${esc(r.wardName)}</td><td class="ward-mini">${r.pillarAssigned}/3</td><td class="ward-mini">${r.leadershipAssigned}/11</td><td class="ward-mini">${r.puCaptainAssigned}/${r.totalPUs}</td><td class="ward-mini">${r.connectorAssigned}/${r.totalPUs*8}</td><td class="ward-mini">${r.verifiedPUs}/${r.totalPUs}</td><td><span class="ward-readiness-bar"><i style="width:${r.score}%"></i></span><span class="ward-readiness-percent">${r.score}%</span></td><td><span class="ward-status ${badgeClass}">${r.status}</span></td><td class="ward-mini">${r.registeredMembers} reg / ${r.approvedMembers} approved</td><td><button class="profile-button" data-ward-profile="${esc(r.wardKey)}">VIEW PROFILE</button></td></tr>`;}).join("") || '<tr><td colspan="11">No wards match the selected filters.</td></tr>';
        $("wardBody").querySelectorAll("[data-ward-profile]").forEach(btn=>btn.addEventListener("click",()=>openWardProfile(btn.dataset.wardProfile)));
        const avg=wardReadinessRows.length?Math.round(wardReadinessRows.reduce((s,r)=>s+r.score,0)/wardReadinessRows.length):0;
        $("stateWardReadinessScore").textContent=`${avg}%`; $("stateWardReadinessText").textContent=`${wardReadinessRows.filter(r=>r.score>0).length} of ${wardReadinessRows.length} wards have at least one active readiness layer.`;
        $("totalWardCount").textContent=wardReadinessRows.length.toLocaleString(); $("wardReadyCount").textContent=wardReadinessRows.filter(r=>r.status==="READY").length; $("wardDevelopingCount").textContent=wardReadinessRows.filter(r=>r.status==="DEVELOPING").length; $("wardStartingCount").textContent=wardReadinessRows.filter(r=>r.status==="STARTING").length; $("wardNotReadyCount").textContent=wardReadinessRows.filter(r=>r.status==="NOT READY").length;
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
                <td class="readiness-mini">${r.registeredMembers} reg / ${r.approvedMemberCount} approved</td>
                <td><button class="profile-button" data-profile="${esc(r.lgaKey)}">VIEW PROFILE</button></td>
            </tr>`;
        }).join("") || '<tr><td colspan="10">No LGAs match the selected filters.</td></tr>';

        $("readinessBody").querySelectorAll("[data-profile]").forEach(btn => btn.addEventListener("click", () => openLgaProfile(btn.dataset.profile)));

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

    function isRecentActivity(a) {
        if (!a || !a.activity_date) return false;
        const d = new Date(a.activity_date + "T23:59:59");
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        return d >= cutoff;
    }

    function buildHealthRows() {
        return readinessRows.map(function (r) {
            const lgaActivities = activities.filter(a => normalize(a.lga_name) === r.lgaKey);
            const recent = lgaActivities.filter(isRecentActivity).length;
            const approvedPu = r.verifiedPUs;
            const puCoverage = r.totalPUs ? pct(r.puCaptainAssigned, r.totalPUs) : 100;
            const connectorCoverage = r.totalPUs ? pct(r.connectorAssigned, r.totalPUs * 8) : 100;
            const commandScore = r.score;
            const membershipScore = r.totalPUs ? pct(approvedPu, r.totalPUs) : 100;
            const activityScore = Math.min(100, recent * 20);
            const health = Math.round(commandScore * 0.45 + membershipScore * 0.20 + puCoverage * 0.15 + connectorCoverage * 0.10 + activityScore * 0.10);
            const status = health >= 75 ? "ACTIVE" : health >= 45 ? "DEVELOPING" : health > 0 ? "WATCH" : "CRITICAL";
            const latest = lgaActivities.slice().sort((a,b) => String(b.activity_date).localeCompare(String(a.activity_date)))[0];
            return { ...r, recent, approvedPu, health, status, latestActivity: latest ? latest.activity_date : "" };
        });
    }

    function renderHealth() {
        const rows = buildHealthRows();
        const search = normalize($("healthSearch").value);
        const statusFilter = $("healthStatus").value;
        const sort = $("healthSort").value;
        let filtered = rows.filter(r => (!search || normalize(r.name).includes(search)) && (!statusFilter || r.status === statusFilter));
        filtered.sort(function(a,b){
            if(sort === "health-asc") return a.health-b.health || a.name.localeCompare(b.name);
            if(sort === "activity-desc") return String(b.latestActivity).localeCompare(String(a.latestActivity)) || b.health-a.health;
            if(sort === "gap-desc") return b.gap-a.gap || a.name.localeCompare(b.name);
            return b.health-a.health || a.name.localeCompare(b.name);
        });
        $("healthBody").innerHTML = filtered.map(function(r){
            const cls = r.status === "ACTIVE" ? "health-active" : r.status === "DEVELOPING" ? "health-developing" : r.status === "WATCH" ? "health-watch" : "health-critical";
            return `<tr><td class="readiness-lga">${esc(r.name)}</td><td>${r.score}%</td><td>${r.approvedPu}/${r.totalPUs}</td><td>${r.puCaptainAssigned}/${r.totalPUs}</td><td>${r.connectorAssigned}/${r.totalPUs*8}</td><td>${r.recent} recent${r.latestActivity ? ` <span class="activity-date">(${esc(r.latestActivity)})</span>` : ""}</td><td class="health-score">${r.health}%</td><td><span class="health-badge ${cls}">${r.status}</span></td><td><button class="profile-button" data-health-profile="${esc(r.lgaKey)}">VIEW PROFILE</button></td></tr>`;
        }).join("") || '<tr><td colspan="9">No LGAs match the selected filters.</td></tr>';
        $("healthBody").querySelectorAll("[data-health-profile]").forEach(btn => btn.addEventListener("click", () => openLgaProfile(btn.dataset.healthProfile)));

        const avg = rows.length ? Math.round(rows.reduce((s,r)=>s+r.health,0)/rows.length) : 0;
        $("stateHealthScore").textContent = `${avg}%`;
        $("stateHealthText").textContent = `${rows.filter(r=>r.health>0).length} of ${rows.length} LGAs have measurable organisational activity or structure.`;
        $("healthActiveLgas").textContent = rows.filter(r=>r.status==="ACTIVE").length;
        $("healthDevelopingLgas").textContent = rows.filter(r=>r.status==="DEVELOPING").length;
        $("healthWatchLgas").textContent = rows.filter(r=>r.status==="WATCH").length;
        $("healthCriticalLgas").textContent = rows.filter(r=>r.status==="CRITICAL").length;
    }

    function renderActivities() {
        const rows = activities.slice().sort((a,b)=>String(b.activity_date).localeCompare(String(a.activity_date))).slice(0,100);
        $("activityBody").innerHTML = rows.map(function(a){
            return `<tr><td class="activity-date">${esc(a.activity_date || "-")}</td><td class="activity-type">${esc(a.activity_type)}</td><td>${esc(a.lga_name)}</td><td>${esc(a.ward_name || "-")}</td><td>${esc(a.polling_unit_name || "-")}</td><td>${esc(a.notes || "-")}</td><td><button class="assign-button remove" data-activity-remove="${esc(a.id)}">REMOVE</button></td></tr>`;
        }).join("") || '<tr><td colspan="7">No activities recorded yet.</td></tr>';
        $("activityBody").querySelectorAll("[data-activity-remove]").forEach(btn=>btn.addEventListener("click",()=>removeActivity(btn.dataset.activityRemove)));
    }

    async function loadActivities() {
        try {
            const { data, error } = await db.rpc("get_omg_activity_log");
            if (error) {
                console.warn("Activity log unavailable. Continuing without activity records.", error);
                activities = [];
                return;
            }
            activities = data || [];
        } catch (error) {
            console.warn("Activity log unavailable. Continuing without activity records.", error);
            activities = [];
        }
    }

    async function saveActivity(event) {
        event.preventDefault();
        const button=$("activitySave"); button.disabled=true; button.textContent="SAVING...";
        try {
            const {data,error}=await db.rpc("save_omg_activity_log",{
                p_activity_type:$("activityType").value,
                p_lga_name:$("activityLga").value,
                p_ward_name:$("activityWard").value,
                p_polling_unit_name:$("activityPu").value,
                p_activity_date:$("activityDate").value,
                p_notes:$("activityNotes").value
            });
            if(error) throw error;
            activities=[data,...activities];
            $("activityForm").reset();
            $("activityDate").value=new Date().toISOString().slice(0,10);
            renderActivities(); renderHealth();
        } catch(error){ alert(error.message || "Unable to log activity."); }
        finally{ button.disabled=false; button.textContent="LOG ACTIVITY"; }
    }

    async function removeActivity(id) {
        if(!confirm("Remove this activity record?")) return;
        const {error}=await db.rpc("remove_omg_activity_log",{p_id:id});
        if(error){alert(error.message || "Unable to remove activity.");return;}
        activities=activities.filter(a=>a.id!==id); renderActivities(); renderHealth();
    }


    function buildPuReadinessRows() {
        puReadinessRows = [];
        hierarchy.state.lgas.forEach(function(lga) {
            const lgaKey = normalize(lga.name);
            (lga.wards || []).forEach(function(ward) {
                const wardKey = lgaKey + "||" + normalize(ward.name);
                (ward.pollingUnits || []).forEach(function(unit) {
                    const puKey = wardKey + "||" + normalize(unit.name);
                    const captain = assignments.find(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key) === puKey && normalize(a.role_code) === "POLLING_UNIT_CAPTAIN" && Number(a.slot_number) === 1 && isActiveAssignment(a));
                    const connectorAssigned = assignments.filter(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key) === puKey && normalize(a.role_code) === "POLLING_UNIT_CONNECTOR" && isActiveAssignment(a)).length;
                    const puMembers = members.filter(m => normalize(m.lga) === lgaKey && normalize(m.ward) === normalize(ward.name) && normalize(m.polling_unit) === normalize(unit.name));
                    const approvedMembers = puMembers.filter(m => normalize(m.membership_status) === "APPROVED");
                    const verified = approvedMembers.length > 0;
                    const puActivities = activities.filter(a => normalize(a.lga_name) === lgaKey && normalize(a.ward_name) === normalize(ward.name) && normalize(a.polling_unit_name) === normalize(unit.name) && isRecentActivity(a));
                    const activityScore = puActivities.length ? Math.min(100, puActivities.length * 20) : 0;
                    const layers = [captain ? 100 : 0, pct(connectorAssigned, 8), verified ? 100 : 0, activityScore];
                    const score = Math.round(layers.reduce((a,b)=>a+b,0)/layers.length);
                    const status = score >= 80 ? "READY" : score >= 50 ? "DEVELOPING" : score > 0 ? "STARTING" : "NOT READY";
                    const assignedTotal = (captain ? 1 : 0) + connectorAssigned;
                    const gap = Math.max(0, 9 - assignedTotal);
                    puReadinessRows.push({
                        lgaName:lga.name,lgaKey,wardName:ward.name,wardKey,puName:unit.name,puKey,code:unit.delimitation || "",
                        captain:captain ? captain.full_name : "VACANT",connectorAssigned,registeredMembers:puMembers.length,approvedMembers:approvedMembers.length,verified,
                        recentActivities:puActivities.length,activityRecords:puActivities,score,status,gap
                    });
                });
            });
        });
    }

    function getPuProfile(puKey) {
        const row = puReadinessRows.find(r => r.puKey === puKey);
        if (!row) return null;
        const connectorSlots = [];
        for (let i=1;i<=8;i++) {
            const assignment = assignments.find(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key) === row.puKey && normalize(a.role_code) === "POLLING_UNIT_CONNECTOR" && Number(a.slot_number) === i && isActiveAssignment(a));
            connectorSlots.push({slotNumber:i,assignment});
        }
        const captainAssignment = assignments.find(a => normalize(a.scope_type) === "POLLING_UNIT" && normalize(a.scope_key) === row.puKey && normalize(a.role_code) === "POLLING_UNIT_CAPTAIN" && Number(a.slot_number) === 1 && isActiveAssignment(a));
        const memberRecords = members.filter(m => normalize(m.lga) === row.lgaKey && normalize(m.ward) === normalize(row.wardName) && normalize(m.polling_unit) === normalize(row.puName));
        const approvedRecords = memberRecords.filter(m => normalize(m.membership_status) === "APPROVED");
        const activityRecords = activities.filter(a => normalize(a.lga_name) === row.lgaKey && normalize(a.ward_name) === normalize(row.wardName) && normalize(a.polling_unit_name) === normalize(row.puName) && isRecentActivity(a)).sort((a,b)=>String(b.activity_date).localeCompare(String(a.activity_date)));
        return {...row, captainAssignment, connectorSlots, memberRecords, approvedRecords, activityRecords};
    }

    function openPuProfile(puKey) {
        const profile = getPuProfile(puKey);
        if (!profile) return;
        currentProfilePu = profile;
        $("puProfileName").textContent = profile.puName;
        $("puProfileStatus").textContent = profile.status;
        $("puProfileLocation").textContent = `${profile.lgaName} • ${profile.wardName} • ${profile.code || "No polling-unit code"}`;
        $("puProfileScore").textContent = `${profile.score}%`;
        $("puProfileScoreText").textContent = `${profile.score}% overall polling-unit readiness`;
        $("puProfileCaptain").textContent = profile.captain;
        $("puProfileCaptain").className = profile.captain === "VACANT" ? "vacant" : "";
        $("puProfileConnectorCount").textContent = `${profile.connectorAssigned}/8`;
        $("puProfileRegisteredMembers").textContent = profile.registeredMembers.toLocaleString();
        $("puProfileApprovedMembers").textContent = profile.approvedMembers.toLocaleString();
        $("puProfileVerified").textContent = profile.verified ? "YES" : "NO";
        $("puProfileActivityCount").textContent = profile.activityRecords.length.toLocaleString();
        $("puProfileCommandStatus").textContent = profile.captainAssignment ? "ASSIGNED" : "VACANT";
        const latest = profile.activityRecords[0];
        $("puProfileLatestActivity").textContent = latest ? latest.activity_date : "NONE";
        $("puCoverageRegistered").textContent = profile.registeredMembers.toLocaleString();
        $("puCoverageApproved").textContent = profile.approvedMembers.toLocaleString();
        $("puCoverageStatus").textContent = profile.verified ? "VERIFIED" : "NOT VERIFIED";
        $("puActivityTotal").textContent = profile.activityRecords.length.toLocaleString();
        $("puActivityLatest").textContent = latest ? `${latest.activity_date} • ${latest.activity_type}` : "None recorded";
        $("puCaptainSlot").innerHTML = `<span>Polling Unit Captain</span><strong class="${profile.captain === "VACANT" ? "vacant" : ""}">${esc(profile.captain)}</strong>`;
        $("puCaptainActions").innerHTML = profile.captainAssignment ? `<button type="button" class="pu-action-button secondary" data-pu-edit="1">EDIT CAPTAIN</button><button type="button" class="pu-action-button secondary" data-pu-remove="${esc(profile.captainAssignment.id)}">REMOVE CAPTAIN</button>` : `<button type="button" class="pu-action-button" data-pu-assign="captain">ASSIGN CAPTAIN</button>`;
        $("puConnectorGrid").innerHTML = profile.connectorSlots.map(x => `<div class="pu-connector"><span>CONNECTOR ${x.slotNumber}</span><strong class="${x.assignment ? "" : "vacant"}">${esc(x.assignment ? x.assignment.full_name : "VACANT")}</strong></div>`).join("");
        $("puActivityList").innerHTML = profile.activityRecords.slice(0,5).map(a=>`<li>${esc(a.activity_date)} • ${esc(a.activity_type)}${a.notes ? ` • ${esc(a.notes)}` : ""}</li>`).join("") || "<li>No recent polling-unit activity recorded.</li>";
        const priority=[];
        if(!profile.captainAssignment) priority.push("Assign the Polling Unit Captain.");
        if(profile.connectorAssigned<8) priority.push(`Recruit ${8-profile.connectorAssigned} remaining connector${8-profile.connectorAssigned===1?'':'s'}.`);
        if(!profile.verified) priority.push("Expand approved membership coverage to establish verified polling-unit presence.");
        if(!profile.activityRecords.length) priority.push("Record a recent polling-unit activity to establish an operational baseline.");
        $("puProfilePriorityList").innerHTML = priority.map(x=>`<li>${esc(x)}</li>`).join("") || "<li>No immediate priority gaps identified.</li>";
        $("puProfileModal").hidden=false;
        $("puCaptainActions").querySelectorAll("[data-pu-assign]").forEach(btn=>btn.addEventListener("click",()=>openModal({scopeType:"POLLING_UNIT",scopeKey:profile.puKey,scopeName:`${profile.lgaName} • ${profile.wardName} • ${profile.puName}`,roleCode:"POLLING_UNIT_CAPTAIN",roleTitle:"Polling Unit Captain",slotNumber:1})));
        $("puCaptainActions").querySelectorAll("[data-pu-edit]").forEach(btn=>btn.addEventListener("click",()=>openModal({scopeType:"POLLING_UNIT",scopeKey:profile.puKey,scopeName:`${profile.lgaName} • ${profile.wardName} • ${profile.puName}`,roleCode:"POLLING_UNIT_CAPTAIN",roleTitle:"Polling Unit Captain",slotNumber:1})));
        $("puCaptainActions").querySelectorAll("[data-pu-remove]").forEach(btn=>btn.addEventListener("click",()=>removeAssignment(btn.dataset.puRemove)));
    }

    function closePuProfile(){ $("puProfileModal").hidden=true; currentProfilePu=null; }

    function renderPuReadiness(){
        const search=normalize($("puSearch").value); const statusFilter=$("puStatus").value; const sort=$("puSort").value;
        let rows=puReadinessRows.filter(r=>(!search || normalize(`${r.lgaName} ${r.wardName} ${r.puName} ${r.code}`).includes(search)) && (!statusFilter || r.status===statusFilter));
        rows.sort((a,b)=>{ if(sort==="score-asc") return a.score-b.score || a.puName.localeCompare(b.puName); if(sort==="gap-desc") return b.gap-a.gap || a.puName.localeCompare(b.puName); if(sort==="pu-asc") return a.puName.localeCompare(b.puName); return b.score-a.score || a.puName.localeCompare(b.puName); });
        $("puBody").innerHTML=rows.slice(0,1000).map(r=>{ const cls=r.status==="READY"?"pu-ready":r.status==="DEVELOPING"?"pu-developing":r.status==="STARTING"?"pu-starting":"pu-none"; return `<tr><td class="pu-mini">${esc(r.lgaName)}</td><td class="pu-mini">${esc(r.wardName)}</td><td class="pu-name">${esc(r.puName)}</td><td class="pu-code">${esc(r.code||"-")}</td><td class="${r.captain==="VACANT"?"command-vacant":"command-assigned"}">${esc(r.captain)}</td><td class="pu-mini">${r.connectorAssigned}/8</td><td class="pu-mini">${r.verified?"VERIFIED":"NOT VERIFIED"}</td><td class="pu-mini">${r.recentActivities}</td><td><span class="pu-progress"><i style="width:${r.score}%"></i></span><span class="pu-score">${r.score}%</span></td><td><span class="pu-status ${cls}">${r.status}</span></td><td><button class="profile-button" data-pu-profile="${esc(r.puKey)}">VIEW PROFILE</button></td></tr>`; }).join("") || '<tr><td colspan="11">No polling units match the selected filters.</td></tr>';
        $("puBody").querySelectorAll("[data-pu-profile]").forEach(btn=>btn.addEventListener("click",()=>openPuProfile(btn.dataset.puProfile)));
        const avg=puReadinessRows.length?Math.round(puReadinessRows.reduce((s,r)=>s+r.score,0)/puReadinessRows.length):0;
        $("statePuReadinessScore").textContent=`${avg}%`;
        $("statePuReadinessText").textContent=`${puReadinessRows.filter(r=>r.score>0).length.toLocaleString()} of ${puReadinessRows.length.toLocaleString()} polling units have at least one active readiness layer.`;
        $("totalPuCount").textContent=puReadinessRows.length.toLocaleString(); $("puReadyCount").textContent=puReadinessRows.filter(r=>r.status==="READY").length.toLocaleString(); $("puDevelopingCount").textContent=puReadinessRows.filter(r=>r.status==="DEVELOPING").length.toLocaleString(); $("puStartingCount").textContent=puReadinessRows.filter(r=>r.status==="STARTING").length.toLocaleString(); $("puNotReadyCount").textContent=puReadinessRows.filter(r=>r.status==="NOT READY").length.toLocaleString(); $("puVerifiedCount").textContent=puReadinessRows.filter(r=>r.verified).length.toLocaleString();
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
        buildWardReadinessRows();
        buildPuReadinessRows();
        renderReadiness();
        renderWardReadiness();
        renderPuReadiness();
        renderHealth();
        renderActivities();
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
            await loadHierarchy();
            await loadAssignments();
            await loadMembers();
            try { await loadActivities(); } catch (activityError) { activities = []; console.warn("Activity log unavailable on Polling Unit page; continuing without it.", activityError); }
            buildSlots();
            buildPuReadinessRows();
            renderPuReadiness();
            $("puSearch").addEventListener("input", renderPuReadiness);
            $("puStatus").addEventListener("change", renderPuReadiness);
            $("puSort").addEventListener("change", renderPuReadiness);
            $("puProfileClose").addEventListener("click", closePuProfile);
            $("puProfileModal").addEventListener("click", e => { if (e.target === $("puProfileModal")) closePuProfile(); });
            $("commandCancel").addEventListener("click", closeModal);
            $("commandForm").addEventListener("submit", saveAssignment);
            $("commandModal").addEventListener("click", e => { if (e.target === $("commandModal")) closeModal(); });
        } catch (error) {
            console.error(error);
            const target = $("statePuReadinessText");
            if (target) target.textContent = error.message || "Unable to load polling-unit intelligence.";
            const body = $("puBody");
            if (body) body.innerHTML = `<tr><td colspan="11">Unable to load polling-unit intelligence.</td></tr>`;
        }
    }

    document.addEventListener("DOMContentLoaded", start);
})();
