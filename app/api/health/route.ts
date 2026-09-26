import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "inova-affiliate-grup",
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: {
      cloudinary: Boolean(
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      ),
      viggle: Boolean(process.env.VIGGLE_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
  });
}
