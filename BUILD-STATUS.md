# Inova Affiliate Grup — Build Status

## V7

- Removed the legacy `@netlify/plugin-nextjs` pin so Netlify can use its current OpenNext adapter automatically.
- Explicitly set the Next.js publish directory to `.next`.
- Added `GET /api/health` for safe deployment/environment checks.
- Health endpoint reports only whether required environment variables exist; it never returns secret values.
- Existing workflows are preserved:
  1. Foto + Video → Video
  2. 1 Foto → 3 Pose
  3. Clothing → Video
