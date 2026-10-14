# OMG referral links upgrade

No new SQL required. Uses existing `members.member_id` as referral code and `omg_referral_claims` for reporting.

- Open Admin > Membership Directory > View member to see the referral profile and copy link.
- Shared link format: `https://ochoudomandategroup.com.ng/membership.html?ref=MEMBER_ID`.
- The public membership form automatically populates the existing referral code field.
- Referral claims remain pending until an admin verifies them in Referral Intelligence.
- Counts on member profile show verified, pending code claims, and other code claims. Name-only claims cannot be attributed until verified.
- Existing members are not changed, no backfill or new IDs are created.

## Verification
1. Deploy files and hard-refresh the membership and admin pages.
2. Open an existing member in Membership Directory, copy referral link.
3. Open link in a private browser window and confirm Referred By code is filled.
4. Submit a genuine consenting test registration, confirm claim in Referral Intelligence.
5. Verify claim, reopen referring member profile and confirm verified count increases.

## Known limitations
- Only referral-code claims appear in member-specific pending counts.
- No approved-referred-member count yet, because that requires a joined membership-status query.
- The existing public referral RPC relies on matching member ID and phone; add rate limiting and abuse controls before using counts for formal recognition.
