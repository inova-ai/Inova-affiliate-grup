# INOVA Affiliate Grup V18.8

- Fixed Viggle API key normalization and 401/403 diagnostics.
- `/api/health` now checks Viggle authentication, not only whether the env variable exists.
- Video Motion and Clothing → Video run a Viggle preflight before upload/render.
- OpenAI 3 Pose remains on the existing authenticated image-edit path.
- 3 Pose output remains 1 square composite photo.
