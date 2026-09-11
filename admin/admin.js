(function () {
    "use strict";

    const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";

    const db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    const path = window.location.pathname;
    const isLoginPage =
        path.endsWith("/admin/login.html") || path.endsWith("/admin/");

    function $(id) {
        return document.getElementById(id);
    }

    async function getSession() {
        const { data, error } = await db.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    async function requireSession() {
        const session = await getSession();

        if (!session) {
            window.location.href = "login.html";
            return null;
        }

        return session;
    }

    function setMessage(elementId, message) {
        const element = $(elementId);
        if (element) element.textContent = message || "";
    }

    async function confirmAdmin() {
        const { data, error } = await db.rpc("is_omg_admin");

        if (error) throw error;

        if (data !== true) {
            await db.auth.signOut();
            window.location.href = "login.html";
            return false;
        }

        return true;
    }

    async function handleLogin() {
        const form = $("adminLoginForm");
        if (!form) return;

        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = $("adminEmail").value.trim();
            const password = $("adminPassword").value;
            const button = $("loginButton");

            button.disabled = true;
            button.textContent = "SIGNING IN...";
            setMessage("loginMessage", "");

            try {
                const { error } = await db.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                const allowed = await confirmAdmin();
                if (!allowed) return;

                window.location.href = "dashboard.html";
            } catch (error) {
                setMessage(
                    "loginMessage",
                    error.message || "Unable to sign in. Please check your details."
                );
            } finally {
                button.disabled = false;
                button.textContent = "LOGIN";
            }
        });
    }

    async function getCount(filter) {
        let query = db
            .from("members")
            .select("id", { count: "exact", head: true });

        if (filter) {
            query = filter(query);
        }

        const { count, error } = await query;

        if (error) throw error;
        return Number(count || 0);
    }

    async function loadBasicDashboard() {
        const session = await requireSession();
        if (!session) return false;

        const emailElement = $("adminUserEmail");
        if (emailElement) {
            emailElement.textContent = session.user.email || "";
        }

        const allowed = await confirmAdmin();
        if (!allowed) return false;

        const totalMembers = await getCount();

        const pendingMembers = await getCount(function (query) {
            return query.ilike("membership_status", "pending");
        });

        const approvedMembers = await getCount(function (query) {
            return query.ilike("membership_status", "approved");
        });

        const rejectedMembers = await getCount(function (query) {
            return query.ilike("membership_status", "rejected");
        });

        const ndcMembers = await getCount(function (query) {
            return query.eq("ndc_member", true);
        });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const todayRegistrations = await getCount(function (query) {
            return query
                .gte("created_at", todayStart.toISOString())
                .lt("created_at", tomorrowStart.toISOString());
        });

        $("totalMembers").textContent = totalMembers.toLocaleString();
        $("pendingMembers").textContent = pendingMembers.toLocaleString();
        $("approvedMembers").textContent = approvedMembers.toLocaleString();
        $("rejectedMembers").textContent = rejectedMembers.toLocaleString();
        $("todayRegistrations").textContent = todayRegistrations.toLocaleString();
        $("ndcMembers").textContent = ndcMembers.toLocaleString();

        return true;
    }

    /* =========================================================
       PHASE 2: GRASSROOTS COVERAGE INTELLIGENCE
    ========================================================= */

    let electoralData = null;
    let allMembers = [];
    let lgaRows = [];
    let selectedLga = null;
    let selectedWard = null;

    function normalize(value) {
        return String(value || "")
            .trim()
            .replace(/\s+/g, " ")
            .toUpperCase();
    }

    function safeNumber(value) {
        return Number(value || 0);
    }

    function statusForCoverage(covered, total) {
        if (!total || covered === 0) return "none";
        if (covered >= total) return "covered";
        return "partial";
    }

    function statusLabel(status) {
        if (status === "covered") return "COVERED";
        if (status === "partial") return "PARTIALLY COVERED";
        return "NOT COVERED";
    }

    function statusBadge(status) {
        return '<span class="coverage-badge coverage-' +
            status +
            '">' +
            statusLabel(status) +
            "</span>";
    }

    function percent(covered, total) {
        if (!total) return 0;
        return Math.round((covered / total) * 1000) / 10;
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function loadElectoralHierarchy() {
        const response = await fetch("../data/imo.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Unable to load Imo electoral hierarchy.");
        }

        const json = await response.json();

        if (
            !json ||
            !json.state ||
            !Array.isArray(json.state.lgas)
        ) {
            throw new Error("The Imo electoral hierarchy is not in the expected format.");
        }

        electoralData = json;
    }

    async function loadAllMembers() {
        const pageSize = 1000;
        let from = 0;
        const rows = [];

        while (true) {
            const { data, error } = await db
                .from("members")
                .select(
                    "id,full_name,membership_status,lga,ward,polling_unit,polling_unit_code"
                )
                .range(from, from + pageSize - 1);

            if (error) throw error;

            const batch = Array.isArray(data) ? data : [];
            rows.push.apply(rows, batch);

            if (batch.length < pageSize) break;

            from += pageSize;

            if (from > 100000) {
                throw new Error("Membership dataset is unexpectedly large.");
            }
        }

        allMembers = rows;
    }

    function buildMemberIndexes() {
        const byLga = new Map();
        const byWard = new Map();
        const byPollingUnit = new Map();

        allMembers.forEach(function (member) {
            const lga = normalize(member.lga);
            const ward = normalize(member.ward);
            const unit = normalize(member.polling_unit);

            if (lga) {
                if (!byLga.has(lga)) byLga.set(lga, []);
                byLga.get(lga).push(member);
            }

            if (lga && ward) {
                const key = lga + "||" + ward;
                if (!byWard.has(key)) byWard.set(key, []);
                byWard.get(key).push(member);
            }

            if (lga && ward && unit) {
                const key = lga + "||" + ward + "||" + unit;
                if (!byPollingUnit.has(key)) byPollingUnit.set(key, []);
                byPollingUnit.get(key).push(member);
            }
        });

        return { byLga, byWard, byPollingUnit };
    }

    let memberIndexes = null;

    function buildLgaRows() {
        memberIndexes = buildMemberIndexes();

        const lgas = electoralData.state.lgas;

        lgaRows = lgas.map(function (lga) {
            const lgaMembers = memberIndexes.byLga.get(normalize(lga.name)) || [];
            const wards = Array.isArray(lga.wards) ? lga.wards : [];

            let coveredWards = 0;
            let coveredPollingUnits = 0;
            let totalPollingUnits = 0;
            let zeroPollingUnits = 0;

            wards.forEach(function (ward) {
                const units = Array.isArray(ward.pollingUnits)
                    ? ward.pollingUnits
                    : [];

                let wardCovered = false;

                units.forEach(function (unit) {
                    totalPollingUnits += 1;

                    const key =
                        normalize(lga.name) +
                        "||" +
                        normalize(ward.name) +
                        "||" +
                        normalize(unit.name);

                    const unitMembers =
                        memberIndexes.byPollingUnit.get(key) || [];

                    if (unitMembers.length > 0) {
                        coveredPollingUnits += 1;
                        wardCovered = true;
                    } else {
                        zeroPollingUnits += 1;
                    }
                });

                if (wardCovered) coveredWards += 1;
            });

            const coverage = percent(
                coveredPollingUnits,
                totalPollingUnits
            );

            return {
                name: lga.name,
                wards: wards,
                totalWards: wards.length,
                coveredWards: coveredWards,
                totalPollingUnits: totalPollingUnits,
                coveredPollingUnits: coveredPollingUnits,
                zeroPollingUnits: zeroPollingUnits,
                members: lgaMembers.length,
                approved: lgaMembers.filter(function (m) {
                    return normalize(m.membership_status) === "APPROVED";
                }).length,
                pending: lgaMembers.filter(function (m) {
                    return normalize(m.membership_status) === "PENDING";
                }).length,
                rejected: lgaMembers.filter(function (m) {
                    return normalize(m.membership_status) === "REJECTED";
                }).length,
                coverage: coverage,
                status: statusForCoverage(
                    coveredPollingUnits,
                    totalPollingUnits
                )
            };
        });

        return lgaRows;
    }

    function updateStateSummary() {
        let totalWards = 0;
        let coveredWards = 0;
        let totalPollingUnits = 0;
        let coveredPollingUnits = 0;
        let totalMembers = allMembers.length;
        let lgasCovered = 0;

        lgaRows.forEach(function (row) {
            totalWards += row.totalWards;
            coveredWards += row.coveredWards;
            totalPollingUnits += row.totalPollingUnits;
            coveredPollingUnits += row.coveredPollingUnits;

            if (row.status === "covered" || row.status === "partial") {
                lgasCovered += 1;
            }
        });

        $("coverageLgas").textContent =
            lgasCovered.toLocaleString() + " / " + lgaRows.length.toLocaleString();

        $("coverageWards").textContent =
            totalWards.toLocaleString();

        $("coverageWardsCovered").textContent =
            coveredWards.toLocaleString();

        $("coveragePollingUnits").textContent =
            totalPollingUnits.toLocaleString();

        $("coveragePollingUnitsCovered").textContent =
            coveredPollingUnits.toLocaleString();

        $("coveragePollingUnitsZero").textContent =
            (totalPollingUnits - coveredPollingUnits).toLocaleString();

        const statePercent = percent(
            coveredPollingUnits,
            totalPollingUnits
        );

        $("stateCoveragePercent").textContent =
            statePercent + "%";

        $("stateCoverageSub").textContent =
            coveredPollingUnits.toLocaleString() +
            " of " +
            totalPollingUnits.toLocaleString() +
            " polling units covered";

        $("coverageUpdated").textContent =
            "Analysis based on " +
            totalMembers.toLocaleString() +
            " membership record" +
            (totalMembers === 1 ? "" : "s") +
            " and the complete electoral hierarchy.";
    }

    function renderLgaRows() {
        const body = $("lgaCoverageBody");

        const search = normalize($("lgaSearch").value);
        const filter = $("lgaCoverageFilter").value;
        const sort = $("lgaSort").value;

        let rows = lgaRows.filter(function (row) {
            if (search && !normalize(row.name).includes(search)) {
                return false;
            }

            if (filter && row.status !== filter) {
                return false;
            }

            return true;
        });

        rows.sort(function (a, b) {
            if (sort === "coverage-asc") return a.coverage - b.coverage;
            if (sort === "members-desc") return b.members - a.members;
            if (sort === "members-asc") return a.members - b.members;
            if (sort === "name-asc") {
                return a.name.localeCompare(b.name);
            }
            return b.coverage - a.coverage;
        });

        if (!rows.length) {
            body.innerHTML =
                '<tr><td colspan="9" class="coverage-empty">No LGAs match the selected filters.</td></tr>';
            return;
        }

        body.innerHTML = rows.map(function (row) {
            return `
                <tr>
                    <td><span class="coverage-name">${escapeHtml(row.name)}</span></td>
                    <td>${row.totalWards}</td>
                    <td>${row.coveredWards}</td>
                    <td>${row.totalPollingUnits.toLocaleString()}</td>
                    <td>${row.coveredPollingUnits.toLocaleString()}</td>
                    <td>${row.members.toLocaleString()}</td>
                    <td>
                        <span class="coverage-progress">
                            <span style="width:${Math.min(row.coverage, 100)}%"></span>
                        </span>
                        <span class="coverage-percent">${row.coverage}%</span>
                    </td>
                    <td>${statusBadge(row.status)}</td>
                    <td>
                        <button
                            type="button"
                            class="coverage-action"
                            data-lga="${escapeHtml(row.name)}">
                            VIEW WARDS
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        body.querySelectorAll("[data-lga]").forEach(function (button) {
            button.addEventListener("click", function () {
                openLga(button.dataset.lga);
            });
        });
    }

    function wardSummary(lga, ward) {
        const units = Array.isArray(ward.pollingUnits)
            ? ward.pollingUnits
            : [];

        let coveredUnits = 0;
        const members = memberIndexes.byWard.get(
            normalize(lga.name) + "||" + normalize(ward.name)
        ) || [];

        units.forEach(function (unit) {
            const key =
                normalize(lga.name) +
                "||" +
                normalize(ward.name) +
                "||" +
                normalize(unit.name);

            if ((memberIndexes.byPollingUnit.get(key) || []).length > 0) {
                coveredUnits += 1;
            }
        });

        return {
            name: ward.name,
            units: units,
            totalUnits: units.length,
            coveredUnits: coveredUnits,
            zeroUnits: units.length - coveredUnits,
            members: members.length,
            approved: members.filter(function (m) {
                return normalize(m.membership_status) === "APPROVED";
            }).length,
            pending: members.filter(function (m) {
                return normalize(m.membership_status) === "PENDING";
            }).length,
            rejected: members.filter(function (m) {
                return normalize(m.membership_status) === "REJECTED";
            }).length,
            coverage: percent(coveredUnits, units.length),
            status: statusForCoverage(coveredUnits, units.length)
        };
    }

    function renderWardRows(lga) {
        const body = $("drilldownBody");

        $("drilldownKicker").textContent = "WARD INTELLIGENCE";
        $("drilldownTitle").textContent = lga.name;
        $("drilldownDescription").textContent =
            "Every ward in " +
            lga.name +
            ", including wards with zero registered members.";

        $("drilldownHead").innerHTML = `
            <tr>
                <th>WARD</th>
                <th>POLLING UNITS</th>
                <th>PU COVERED</th>
                <th>ZERO-COVERAGE PU</th>
                <th>MEMBERS</th>
                <th>APPROVED</th>
                <th>PENDING</th>
                <th>COVERAGE</th>
                <th>STATUS</th>
                <th></th>
            </tr>
        `;

        const rows = lga.wards.map(function (ward) {
            return wardSummary(lga, ward);
        });

        if (!rows.length) {
            body.innerHTML =
                '<tr><td colspan="10" class="coverage-empty">No wards found for this LGA.</td></tr>';
            return;
        }

        body.innerHTML = rows.map(function (row) {
            return `
                <tr>
                    <td><span class="coverage-name">${escapeHtml(row.name)}</span></td>
                    <td>${row.totalUnits}</td>
                    <td>${row.coveredUnits}</td>
                    <td>${row.zeroUnits}</td>
                    <td>${row.members}</td>
                    <td>${row.approved}</td>
                    <td>${row.pending}</td>
                    <td>
                        <span class="coverage-progress">
                            <span style="width:${Math.min(row.coverage, 100)}%"></span>
                        </span>
                        <span class="coverage-percent">${row.coverage}%</span>
                    </td>
                    <td>${statusBadge(row.status)}</td>
                    <td>
                        <button
                            type="button"
                            class="coverage-action"
                            data-ward="${escapeHtml(row.name)}">
                            VIEW POLLING UNITS
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        body.querySelectorAll("[data-ward]").forEach(function (button) {
            button.addEventListener("click", function () {
                openWard(lga, button.dataset.ward);
            });
        });
    }

    function renderPollingUnitRows(lga, ward) {
        const body = $("drilldownBody");

        $("drilldownKicker").textContent = "POLLING UNIT INTELLIGENCE";
        $("drilldownTitle").textContent =
            lga.name + " • " + ward.name;
        $("drilldownDescription").textContent =
            "Individual polling-unit coverage, membership volume and approval status.";

        $("drilldownHead").innerHTML = `
            <tr>
                <th>POLLING UNIT</th>
                <th>CODE</th>
                <th>MEMBERS</th>
                <th>APPROVED</th>
                <th>PENDING</th>
                <th>REJECTED</th>
                <th>STATUS</th>
            </tr>
        `;

        const units = Array.isArray(ward.pollingUnits)
            ? ward.pollingUnits
            : [];

        if (!units.length) {
            body.innerHTML =
                '<tr><td colspan="7" class="coverage-empty">No polling units found for this ward.</td></tr>';
            return;
        }

        body.innerHTML = units.map(function (unit) {
            const key =
                normalize(lga.name) +
                "||" +
                normalize(ward.name) +
                "||" +
                normalize(unit.name);

            const members =
                memberIndexes.byPollingUnit.get(key) || [];

            const approved = members.filter(function (m) {
                return normalize(m.membership_status) === "APPROVED";
            }).length;

            const pending = members.filter(function (m) {
                return normalize(m.membership_status) === "PENDING";
            }).length;

            const rejected = members.filter(function (m) {
                return normalize(m.membership_status) === "REJECTED";
            }).length;

            const status = members.length > 0
                ? "covered"
                : "none";

            return `
                <tr>
                    <td><span class="coverage-name">${escapeHtml(unit.name)}</span></td>
                    <td class="coverage-muted">${escapeHtml(unit.delimitation || "-")}</td>
                    <td>${members.length}</td>
                    <td>${approved}</td>
                    <td>${pending}</td>
                    <td>${rejected}</td>
                    <td>${statusBadge(status)}</td>
                </tr>
            `;
        }).join("");
    }

    function renderBreadcrumb() {
        const breadcrumb = $("coverageBreadcrumb");

        if (!selectedLga) {
            breadcrumb.innerHTML = "";
            return;
        }

        let html =
            '<button type="button" id="breadcrumbLga">ALL LGAs</button>' +
            '<span>›</span>';

        if (!selectedWard) {
            html += '<span class="current">' +
                escapeHtml(selectedLga.name) +
                "</span>";
        } else {
            html +=
                '<button type="button" id="breadcrumbSelectedLga">' +
                escapeHtml(selectedLga.name) +
                "</button>" +
                "<span>›</span>" +
                '<span class="current">' +
                escapeHtml(selectedWard.name) +
                "</span>";
        }

        breadcrumb.innerHTML = html;

        $("breadcrumbLga").addEventListener("click", closeDrilldown);

        if ($("breadcrumbSelectedLga")) {
            $("breadcrumbSelectedLga").addEventListener("click", function () {
                selectedWard = null;
                renderBreadcrumb();
                renderWardRows(selectedLga);
            });
        }
    }

    function showDrilldown() {
        $("coverageDrilldown").hidden = false;
        $("coverageDrilldown").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function closeDrilldown() {
        selectedLga = null;
        selectedWard = null;
        $("coverageDrilldown").hidden = true;
        $("coverageBreadcrumb").innerHTML = "";
    }

    function openLga(name) {
        const lga = electoralData.state.lgas.find(function (item) {
            return normalize(item.name) === normalize(name);
        });

        if (!lga) return;

        selectedLga = lga;
        selectedWard = null;

        renderBreadcrumb();
        renderWardRows(lga);
        showDrilldown();
    }

    function openWard(lga, wardName) {
        const ward = lga.wards.find(function (item) {
            return normalize(item.name) === normalize(wardName);
        });

        if (!ward) return;

        selectedLga = lga;
        selectedWard = ward;

        renderBreadcrumb();
        renderPollingUnitRows(lga, ward);
        showDrilldown();
    }

    async function loadCoverageIntelligence() {
        try {
            $("lgaCoverageBody").innerHTML =
                '<tr><td colspan="9" class="coverage-loading">Loading electoral hierarchy and membership data...</td></tr>';

            await loadElectoralHierarchy();
            await loadAllMembers();

            buildLgaRows();
            updateStateSummary();
            renderLgaRows();

        } catch (error) {
            console.error("Grassroots coverage error:", error);

            $("lgaCoverageBody").innerHTML =
                '<tr><td colspan="9" class="coverage-empty">' +
                escapeHtml(
                    error.message ||
                    "Unable to load grassroots coverage intelligence."
                ) +
                "</td></tr>";

            setMessage(
                "dashboardMessage",
                "Dashboard loaded, but grassroots coverage intelligence could not be loaded."
            );
        }
    }

    /* =========================================================
       LOGOUT
    ========================================================= */

    async function handleLogout() {
        const button = $("logoutButton");
        if (!button) return;

        button.addEventListener("click", async function () {
            button.disabled = true;

            const { error } = await db.auth.signOut();

            if (error) {
                button.disabled = false;
                alert("Unable to log out. Please try again.");
                return;
            }

            window.location.href = "login.html";
        });
    }

    /* =========================================================
       AUTH STATE
    ========================================================= */

    db.auth.onAuthStateChange(function (_event, session) {
        if (!isLoginPage && !session) {
            window.location.href = "login.html";
        }
    });

    /* =========================================================
       STARTUP
    ========================================================= */

    document.addEventListener("DOMContentLoaded", function () {
        if (isLoginPage) {
            handleLogin();
            return;
        }

        if (!document.querySelector(".dashboard-body")) {
            return;
        }

        loadBasicDashboard()
            .then(function (loaded) {
                if (!loaded) return;

                handleLogout();
                loadCoverageIntelligence();

                $("lgaSearch").addEventListener("input", renderLgaRows);
                $("lgaCoverageFilter").addEventListener("change", renderLgaRows);
                $("lgaSort").addEventListener("change", renderLgaRows);
            })
            .catch(function (error) {
                console.error("Dashboard error:", error);

                setMessage(
                    "dashboardMessage",
                    error.message || "Unable to load dashboard."
                );

                handleLogout();
            });
    });
})();
