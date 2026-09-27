# INOVA Affiliate Grup V19.0-HF

- 3 Pose no longer uses OPENAI_API_KEY.
- 3 Pose now uses Hugging Face Inference Providers server-side via HF_TOKEN.
- Output remains one square 3-panel composite.
- Video Motion / Clothing → Video still use Viggle.
- Clothing image generation still uses the existing OpenAI route; only 3 Pose was switched away from OpenAI.
- `/api/health` now reports Hugging Face authentication for the 3 Pose workflow.
