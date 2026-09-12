(function () {
  "use strict";
  const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const form = document.getElementById("setupForm");
  const message = document.getElementById("setupMessage");
  const button = document.getElementById("setupButton");

  function setMessage(text) { message.textContent = text || ""; }

  async function checkSession() {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      setMessage("This invitation link is invalid or has expired. Please ask a Super Administrator to send a new invitation.");
      button.disabled = true;
      return false;
    }
    return true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;
    if (password.length < 8) { setMessage("Your password must contain at least 8 characters."); return; }
    if (password !== confirm) { setMessage("The passwords do not match."); return; }
    button.disabled = true; button.textContent = "SAVING..."; setMessage("Creating your secure password...");
    try {
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password created successfully. Redirecting to NARDTOPUS login...");
      setTimeout(() => { window.location.href = "login.html"; }, 900);
    } catch (e) {
      console.error(e);
      setMessage(e.message || "Unable to set your password. Please request a new invitation.");
      button.disabled = false; button.textContent = "SET PASSWORD";
    }
  });

  checkSession().catch(e => { console.error(e); setMessage("Unable to verify this invitation. Please request a new invitation."); button.disabled = true; });
})();
