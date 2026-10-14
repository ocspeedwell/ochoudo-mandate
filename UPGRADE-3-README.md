# OMG Platform Upgrade 3

Includes social image metadata for homepage and membership/referral links, super-admin-only dashboard entry (existing role RPC required), mobile admin CSS and PWA improvements.

## Deploy
Upload repository contents to GitHub main, wait for Pages deployment. Clear browser cache or reload. Check homepage and membership previews in Meta Sharing Debugger. Referral `?ref=` remains intact.

## Administrator security
The existing admin-users.html / admin-users.js depends on RPCs and role-aware database setup. This package DOES NOT create those RPCs or change existing Supabase permissions. Confirm they exist before using administrator management. The dashboard link is hidden unless `omg_get_my_admin_profile` returns an active `super_admin`. Backend RLS must independently enforce this.

## PWA
The public manifest and admin manifest already existed. Added manifest links and safer public service-worker cache restrictions. Browsers may offer install, or use Add to Home Screen. Separate app identities on the same origin can vary by browser.

## Testing
Check mobile screens, social preview images, referral form auto-fill, admin access with super admin and ordinary admin, and publication workflow. These require live testing.
