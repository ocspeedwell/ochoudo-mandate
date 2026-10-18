# OMG Photo Studio, light-grey background edition

New registration enhancement: optional in-browser MediaPipe person segmentation with #E5E5E5 background and before/after approval. The photo is not sent to a remote image-generation API; the model loads from jsDelivr and runs locally in the browser. The existing Supabase upload and ID card paths use the approved selectedPhoto. Original normalized photo can be restored. No API keys required.

**Limitations:** Segmentation is not guaranteed for every photograph and may leave artifacts around hair or clothes. This is not generative AI restoration, face-aware ID crop, or administrator batch processing. Browser needs internet to fetch MediaPipe model and library, and device support must be tested. The member must approve the replacement. Existing stored member photos are untouched.

**Staging checklist:** camera, gallery, slow/offline connection, poor portrait, multiple rapid selections, compare/accept/reject, form preview, successful Supabase submission and generated ID card. Verify CDN is permitted by Content Security Policy. Do not deploy before end-to-end staging tests.
