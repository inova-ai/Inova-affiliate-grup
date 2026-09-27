import { NextResponse } from "next/server";

export const runtime = "nodejs";

function clean(raw: string) { return raw.trim().replace(/^Bearer\s+/i, "").replace(/^[\"']|[\"']$/g, ""); }

export async function GET() {
  const hfToken = clean(process.env.HF_TOKEN || "");
  const viggleKey = clean(process.env.VIGGLE_API_KEY || "");
  let hfAuthenticated = false;
  let hfError = "";
  let viggleAuthenticated = false;
  let viggleError = "";

  if (hfToken) {
    try {
      const response = await fetch("https://huggingface.co/api/whoami-v2", { headers: { Authorization: `Bearer ${hfToken}` }, cache: "no-store" });
      hfAuthenticated = response.ok;
      if (!response.ok) { const data = await response.json().catch(() => ({})); hfError = data?.error || `Hugging Face authentication failed (HTTP ${response.status}).`; }
    } catch (error) { hfError = error instanceof Error ? error.message : "Hugging Face connection failed."; }
  }

  if (viggleKey) {
    try {
      const response = await fetch("https://apis.viggle.ai/v1/videos/__inova_health_check__", { headers: { Authorization: `Bearer ${viggleKey}` }, cache: "no-store" });
      viggleAuthenticated = response.ok || response.status === 404;
      if (!viggleAuthenticated) { const data = await response.json().catch(() => ({})); viggleError = data?.message || data?.error || `Viggle authentication failed (HTTP ${response.status}).`; }
    } catch (error) { viggleError = error instanceof Error ? error.message : "Viggle connection failed."; }
  }

  const cloudinary = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
  return NextResponse.json({
    ok: cloudinary && hfAuthenticated && viggleAuthenticated,
    service: "inova-affiliate-grup", status: cloudinary && hfAuthenticated && viggleAuthenticated ? "healthy" : "degraded", timestamp: new Date().toISOString(),
    environment: { cloudinary, viggle: Boolean(viggleKey), viggleAuthenticated, huggingface: Boolean(hfToken), huggingfaceAuthenticated: hfAuthenticated, imageModel: process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.2-dev", ...(hfError ? { huggingfaceError: hfError } : {}), ...(viggleError ? { viggleError } : {}) }
  });
}
