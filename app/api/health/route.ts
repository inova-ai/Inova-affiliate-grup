import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getOpenAIKey() {
  const raw = process.env.OPENAI_API_KEY || "";
  return raw.trim().replace(/^['\"]|['\"]$/g, "");
}

export async function GET() {
  const key = getOpenAIKey();
  let openaiAuthenticated = false;
  let openaiError = "";

  if (key) {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      openaiAuthenticated = response.ok;
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        openaiError = data?.error?.message || `OpenAI authentication failed (HTTP ${response.status}).`;
      }
    } catch (error) {
      openaiError = error instanceof Error ? error.message : "OpenAI connection failed.";
    }
  }

  return NextResponse.json({
    ok: Boolean(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET &&
      process.env.VIGGLE_API_KEY &&
      key
    ) && openaiAuthenticated,
    service: "inova-affiliate-grup",
    status: openaiAuthenticated ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    environment: {
      cloudinary: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET),
      viggle: Boolean(process.env.VIGGLE_API_KEY),
      openai: Boolean(key),
      openaiAuthenticated,
      ...(openaiError ? { openaiError } : {}),
    },
  });
}
