# Inova Affiliate Grup — V12

- Preserved all existing workflows.
- Preserved server-side API key usage.
- Preserved V11 OpenAI Image Edit diagnostics.
- Fixed Netlify deployment failure caused by secret scanning of Next.js production webpack cache.
- Production webpack cache is disabled so secret values are not retained in `.next/cache/webpack` build artifacts.
- Netlify build clears `.next` and `.netlify` before building to avoid stale cache artifacts.
