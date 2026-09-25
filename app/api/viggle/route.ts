import { NextResponse } from "next/server";

const BASE_URL = "https://apis.viggle.ai";

export async function POST(request: Request) {
  const key = process.env.VIGGLE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "VIGGLE_API_KEY belum diatur di Netlify." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const imageUrl = String(body.imageUrl || "");
  const clothingMode = Boolean(body.clothingMode);
  const motionVideoUrl = String(body.motionVideoUrl || (clothingMode ? process.env.CLOTHING_MOTION_VIDEO_URL || "https://assets.viggle.ai/pub/www/developers/sample-motion-97bb074a.mp4" : ""));
  if (!imageUrl || !motionVideoUrl) {
    return NextResponse.json({ error: "Foto dan video referensi wajib tersedia." }, { status: 400 });
  }

  const form = new FormData();
  form.append("image_url", imageUrl);
  form.append("motion_video_url", motionVideoUrl);

  const response = await fetch(`${BASE_URL}/v1/renders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json({ error: data?.message || data?.error || "Viggle API menolak render." }, { status: response.status });
  }

  return NextResponse.json({ ok: true, id: data.id, status: data.status || "processing" });
}

export async function GET(request: Request) {
  const key = process.env.VIGGLE_API_KEY;
  if (!key) return NextResponse.json({ error: "VIGGLE_API_KEY belum diatur di Netlify." }, { status: 500 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Render ID wajib diisi." }, { status: 400 });

  const response = await fetch(`${BASE_URL}/v1/videos/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json({ error: data?.message || data?.error || "Gagal membaca status Viggle." }, { status: response.status });
  }
  return NextResponse.json(data);
}
