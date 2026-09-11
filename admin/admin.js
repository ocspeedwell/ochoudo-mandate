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

                const { data: adminCheck, error: adminError } =
                    await db.rpc("is_omg_admin");

                if (adminError || adminCheck !== true) {
                    await db.auth.signOut();
                    throw new Error(
                        "This account is not authorised for the OMG admin dashboard."
                    );
                }

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

    async function loadDashboard() {
        const session = await requireSession();
        if (!session) return;

        const emailElement = document.getElementById("adminUserEmail");
        if (emailElement) emailElement.textContent = session.user.email || "";

        const { data: isAdmin, error: adminError } =
            await db.rpc("is_omg_admin");

        if (adminError || isAdmin !== true) {
            await db.auth.signOut();
            window.location.href = "login.html";
            return;
        }

        const { data, error } =
            await db.rpc("get_omg_dashboard_stats");

        if (error) {
            setMessage(
                "dashboardMessage",
                "Unable to load dashboard statistics. Confirm that the OMG admin SQL setup has been completed."
            );
            return;
        }

        document.getElementById("totalMembers").textContent =
            Number(data.total_members || 0).toLocaleString();

        document.getElementById("pendingMembers").textContent =
            Number(data.pending_members || 0).toLocaleString();

        document.getElementById("approvedMembers").textContent =
            Number(data.approved_members || 0).toLocaleString();

        document.getElementById("rejectedMembers").textContent =
            Number(data.rejected_members || 0).toLocaleString();

        document.getElementById("todayRegistrations").textContent =
            Number(data.today_registrations || 0).toLocaleString();

        document.getElementById("ndcMembers").textContent =
            Number(data.ndc_members || 0).toLocaleString();
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
                setMessage(
                    "dashboardMessage",
                    error.message || "Unable to load dashboard."
                );
            });
            handleLogout();
        }
    });
})();
