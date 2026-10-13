# Ochoudo Newsroom fixes

1. Publishing confirmation now verifies the Supabase write and shows a live article link and copy button.
2. Share links point to `/news/<slug>.html`, where server-readable Open Graph metadata exists. The old `/article.html?slug=...` address cannot supply article-specific previews to social crawlers on GitHub Pages.
3. The GitHub Actions workflow `.github/workflows/newsroom-previews.yml` generates static pages every 15 minutes, but scheduled workflows can be delayed. Run it manually using GitHub > Actions > Update Newsroom social previews > Run workflow immediately after publishing. Check that workflow permissions allow read/write and the workflow run succeeds.
4. For WhatsApp/Facebook share the `/news/<slug>.html` URL, not `/article.html?slug=...`. Use Meta Sharing Debugger to refresh cached previews. A featured image must be public and ideally 1200 x 630 pixels.
5. All public website footers and generated article footers credit CoreKnight Technologies Ltd with a link to https://coreknight.com.

No SQL changes required. Existing data and other admin features are retained.
