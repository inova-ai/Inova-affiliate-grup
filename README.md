# Inova Affiliate Grup — Viggle + 3 Pose Studio

Two separate AI workflows:

## Workflow 1 — Foto + Video -> Video
1. Upload 1 source photo.
2. Upload 1 reference/driving video.
3. Inova uploads media to Cloudinary and calls the official Viggle V1 API server-side.
4. The finished Viggle Video Remix is shown in Inova.

## Workflow 2 — 1 Foto -> 3 Pose
1. Upload 1 source photo.
2. Choose `1 Foto -> 3 Pose`.
3. Inova sends the same source image to the image-edit endpoint three times with three different pose instructions.
4. The prompts explicitly preserve face, hair, clothing, colors, patterns, accessories, and body proportions while changing the pose.
5. Three separate images are shown with download buttons.

The 3-pose workflow is separate from Viggle because the public Viggle API is focused on Video Remix, reusable Character/Motion resources, 3D outputs, and H3 video generation. The image-edit endpoint in this project uses OpenAI Images API.

## Netlify environment variables

```text
VIGGLE_API_KEY=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
OPENAI_API_KEY=...
OPENAI_IMAGE_MODEL=gpt-image-2
```

Keep both API keys server-side. Do not place them in client-side JavaScript.

## Clothing → Video (tambahan)
Fitur tambahan ini tidak menghapus workflow lama. Upload foto pakaian, pilih model pria/wanita dan gaya, lalu aplikasi membuat gambar model yang mengenakan pakaian dengan OpenAI Images API dan mengirimkannya ke Viggle Video Remix menggunakan motion preset yang ditentukan oleh `CLOTHING_MOTION_VIDEO_URL`.

Environment tambahan:
- `CLOTHING_MOTION_VIDEO_URL` — URL publik video motion preset 5–15 detik.
