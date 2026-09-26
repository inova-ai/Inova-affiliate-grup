# Build Status — V15

- Keeps the existing Inova Affiliate Grup workflows intact.
- Keeps Netlify Secrets Scanning enabled.
- Configures Netlify to omit only these non-credential configuration values from secret-value scanning: `OPENAI_IMAGE_MODEL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- The actual `OPENAI_API_KEY` and `VIGGLE_API_KEY` remain protected by secret scanning.
- Removed the temporary `check-env-bundle` build script from the previous iteration.
