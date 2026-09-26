import { NextResponse } from "next/server";

export const runtime = "nodejs";

function env(name: string) {
  return process.env[name] || "";
}

export async function GET() {
  const cloudName = env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const uploadPreset = env("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");

  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      { error: "Cloudinary belum dikonfigurasi di Netlify (cloud name + unsigned upload preset)." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { cloudinary: { cloudName, uploadPreset } },
    { headers: { "Cache-Control": "no-store" } }
  );
}
