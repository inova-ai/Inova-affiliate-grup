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


## 3 Pose → 1 Foto
The 3-pose workflow generates three separate pose edits server-side and then combines them in the browser into one square JPEG with three equal vertical panels (standing, 3/4, sitting). The individual generated images are no longer the primary output.

### OpenAI key
Set `OPENAI_API_KEY` in the deployment environment. Do not include `Bearer`, quotes, or whitespace around the key. If the API returns HTTP 401, the app now shows a specific key/configuration message instead of the generic `Unknown API key`.


## V18.7 Pose API Sync Fix
The pose route is version-stamped (`x-inova-pose-route: 18.7`) and the UI preflights `/api/health` before generating. If the browser still reports the old `Unknown API key` text after deployment, the deployed Netlify function is stale and this ZIP must be redeployed.
