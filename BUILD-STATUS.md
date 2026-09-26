# Build Status — V13

- Removed direct `NEXT_PUBLIC_CLOUDINARY_*` access from the client bundle.
- Added `/api/config` to provide the Cloudinary unsigned upload settings at runtime.
- Changed `OPENAI_IMAGE_MODEL` access to dynamic server-side environment lookup so Next.js does not inline its value into build artifacts.
- Kept Netlify Secrets Scanning enabled.
- Kept existing AI workflows and API routes intact.
