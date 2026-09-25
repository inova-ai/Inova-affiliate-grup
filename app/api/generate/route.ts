import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const productName = String(body.productName || "Produk affiliate");
  const tone = String(body.tone || "Luxury & persuasive");
  const platform = String(body.platform || "TikTok / Reels");

  const result = {
    hook: `Jangan scroll dulu — ${productName} ini punya satu detail yang bikin pemakaiannya terasa jauh lebih praktis.`,
    caption: `${productName} dengan visual premium, manfaat jelas, dan demo yang langsung terlihat. Cocok untuk konten ${platform}. ✨`,
    description: `Konten affiliate untuk ${productName}. Tone: ${tone}. Tampilkan produk secara jelas, gunakan gerakan dari video referensi, lalu tutup dengan CTA yang singkat dan spesifik.`,
    script: `0–3s: tampilkan produk + hook kuat.\n3–8s: ikuti gerakan utama dari video referensi.\n8–14s: sorot detail/manfaat produk.\n14–18s: tampilkan produk sekali lagi + CTA.`,
    cta: "Cek produk sekarang dan lihat detailnya di link yang tersedia.",
    vigglePrompt: `Create a polished commercial product remix for ${productName}. Preserve the source image's appearance and proportions. Transfer the full-body motion, timing, contact, and camera rhythm from the driving reference video naturally. Keep the product/character visually consistent, realistic, sharp and centered. Avoid deformation, extra limbs, flicker, warped logos, duplicate objects, or sudden camera jumps. Premium affiliate-ad aesthetic, clean lighting, smooth motion, vertical social-video composition.`,
    viggleSettings: `Mode: Video Remix (JST-2)\nCharacters: 1\nSource: uploaded product/character image\nDriving motion: uploaded reference video\nTarget: ${platform}\nRecommended composition: 9:16 vertical`,
  };

  return NextResponse.json({ ok: true, result });
}
