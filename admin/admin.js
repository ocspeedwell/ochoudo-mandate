(function () {
    const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";

    const db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    const path = window.location.pathname;
    const isLoginPage =
        path.endsWith("/admin/login.html") || path.endsWith("/admin/");

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
        const element = document.getElementById(elementId);
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
        const form = document.getElementById("adminLoginForm");
        if (!form) return;

        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("adminEmail").value.trim();
            const password = document.getElementById("adminPassword").value;
            const button = document.getElementById("loginButton");

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

    async function loadDashboard() {
        const session = await requireSession();
        if (!session) return;

        const emailElement = document.getElementById("adminUserEmail");
        if (emailElement) {
            emailElement.textContent = session.user.email || "";
        }

        const allowed = await confirmAdmin();
        if (!allowed) return;

        try {
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

            document.getElementById("totalMembers").textContent =
                totalMembers.toLocaleString();

            document.getElementById("pendingMembers").textContent =
                pendingMembers.toLocaleString();

            document.getElementById("approvedMembers").textContent =
                approvedMembers.toLocaleString();

            document.getElementById("rejectedMembers").textContent =
                rejectedMembers.toLocaleString();

            document.getElementById("todayRegistrations").textContent =
                todayRegistrations.toLocaleString();

            document.getElementById("ndcMembers").textContent =
                ndcMembers.toLocaleString();

            setMessage("dashboardMessage", "");
        } catch (error) {
            console.error("Dashboard statistics error:", error);

            setMessage(
                "dashboardMessage",
                error.message || "Unable to load dashboard statistics."
            );
        }
    }

    async function handleLogout() {
        const button = document.getElementById("logoutButton");
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

    db.auth.onAuthStateChange(function (_event, session) {
        if (!isLoginPage && !session) {
            window.location.href = "login.html";
        }
    });

    document.addEventListener("DOMContentLoaded", function () {
        if (isLoginPage) {
            handleLogin();
        } else if (document.querySelector(".dashboard-body")) {
            loadDashboard().catch(function (error) {
                console.error("Dashboard error:", error);
                setMessage(
                    "dashboardMessage",
                    error.message || "Unable to load dashboard."
                );
            });

            handleLogout();
        }
    });
})();
