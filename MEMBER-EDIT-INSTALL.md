# Member profile editor installation

1. Back up the Supabase database.
2. Review and execute `admin/member-profile-edit-setup.sql` in Supabase SQL Editor. It assumes `members.id` is UUID and `ndc_member` is boolean. If the database differs, do not execute until adapted.
3. Upload website files to GitHub Pages.
4. Open Admin > Membership Directory > View > Edit Member Profile.
5. Test using a noncritical test member and verify the audit table.

This first release supports name, phone, email, LGA, ward, polling unit, NDC declaration and NDC card number. It does NOT yet support uploading party card images. This requires confirming existing private storage bucket and policies. Existing membership IDs, status, referrals and registration dates are untouched.

Security note: `is_omg_admin()` currently grants all active administrators permission to edit. Implement a dedicated role-aware check before granting editing only to specific roles. Audit rows contain personal data and are not accessible from client accounts.
