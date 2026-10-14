/* Populate referral code from a member-shared link without changing registration logic. */
(() => {
  const code = new URLSearchParams(location.search).get('ref');
  if (!code || !/^[a-zA-Z0-9_-]{1,80}$/.test(code)) return;
  const field = document.getElementById('referral_code');
  if (!field) return;
  if (!field.value.trim()) field.value = code;
  field.dispatchEvent(new Event('input',{bubbles:true}));
})();
