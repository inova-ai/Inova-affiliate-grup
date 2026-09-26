# Inova Affiliate Grup

Premium AI affiliate studio built with Next.js.

## Workflows

1. **Foto + Video → Video** — photo + reference motion video → Viggle Video Remix.
2. **1 Foto → 3 Pose** — one photo → three pose variations using OpenAI image editing.
3. **Clothing → Video** — clothing photo → AI model wearing the garment → Viggle motion video.

## Deployment

The project is configured for modern Netlify Next.js deployment using the automatically managed OpenNext adapter. The legacy `@netlify/plugin-nextjs` plugin is intentionally not pinned.

## Health check

After deployment, open:

`/api/health`

It returns deployment status and boolean checks for Cloudinary, Viggle, and OpenAI environment variables without exposing secret values.
