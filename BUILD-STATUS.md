# Inova Affiliate Grup — V11

## Changes
- Kept the existing 3 workflows unchanged.
- Hardened `/api/pose-edit` for GPT Image editing.
- Added OpenAI Image Edit diagnostics to the API response without exposing the API key.
- Captures OpenAI HTTP status, request ID, model, error type/code/param, source content type and source byte size.
- 3 Pose UI now includes the OpenAI Request ID when an error is returned, making the next diagnosis definitive.

## Deployment
Use the same Netlify settings/environment variables from V10.
