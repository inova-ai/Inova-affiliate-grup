import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getOpenAIKey() {
  // Keep the key server-side. Netlify/Vercel environment variable must be named OPENAI_API_KEY.
  const raw = process.env.OPENAI_API_KEY || "";
  return raw.trim().replace(/^Bearer\s+/i, "").replace(/^['"]|['"]$/g, "");
}

function getImageModel() {
  return (process.env.OPENAI_IMAGE_MODEL || "gpt-image-2").trim();
}

function openAIErrorMessage(data: any, status: number) {
  const msg = data?.error?.message || data?.message;
  if (status === 401) {
    return "OpenAI API key ditolak (401). Pastikan environment variable OPENAI_API_KEY di Netlify berisi API key OpenAI yang aktif, tanpa tanda kutip dan tanpa tulisan Bearer.";
  }
  if (status === 403) {
    return "OpenAI menolak akses (403). Periksa project/billing dan akses model image pada API key tersebut.";
  }
  return msg || `OpenAI image edit gagal (HTTP ${status}).`;
}

export async function POST(req: Request) {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      return NextResponse.json({
        error: "OPENAI_API_KEY belum dikonfigurasi di Netlify. Tambahkan variable OPENAI_API_KEY pada environment yang dipakai deployment, lalu redeploy."
      }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl = String(body?.imageUrl || "").trim();
    const pose = String(body?.pose || "").trim();
    if (!imageUrl || !pose) {
      return NextResponse.json({ error: "imageUrl dan pose wajib diisi." }, { status: 400 });
    }

    let sourceResponse: Response;
    try {
      sourceResponse = await fetch(imageUrl, { cache: "no-store" });
    } catch (error) {
      return NextResponse.json({ error: `Gagal mengambil foto sumber: ${error instanceof Error ? error.message : "network error"}` }, { status: 502 });
    }
    if (!sourceResponse.ok) {
      return NextResponse.json({ error: `Gagal mengambil foto sumber dari Cloudinary (HTTP ${sourceResponse.status}).` }, { status: 502 });
    }

    const sourceBlob = await sourceResponse.blob();
    if (!sourceBlob.size) return NextResponse.json({ error: "Foto sumber kosong atau tidak dapat dibaca." }, { status: 422 });

    const contentType = (sourceResponse.headers.get("content-type") || sourceBlob.type || "image/jpeg").split(";")[0].toLowerCase();
    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

    const prompt = [
      "Edit the supplied fashion/product photo into a new pose while preserving the same adult person and the exact same clothing.",
      "Identity preservation is critical: keep the exact same face, facial features, hairstyle, hair color, skin tone, body proportions, age appearance, clothing items, clothing colors, fabric texture, prints, logos and accessories.",
      "Do not redesign, recolor, replace, remove, or add clothing. Do not change the person's identity.",
      "Keep the same overall product/fashion presentation and realistic photography quality. Change primarily the body pose and camera-facing posture.",
      pose,
      "Create a clean commercial fashion catalog photo with realistic anatomy, natural hands and feet, consistent lighting and an uncluttered studio/background. Keep the full body visible when possible.",
      "Return one photo only. No collage, no split screen, no extra person, no duplicate limbs, no text and no watermark."
    ].join(" ");

    const model = getImageModel();
    const form = new FormData();
    form.append("model", model);
    form.append("image[]", sourceBlob, `source.${extension}`);
    form.append("prompt", prompt);
    form.append("n", "1");
    form.append("size", "1024x1536");
    form.append("quality", "medium");
    form.append("output_format", "png");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      cache: "no-store",
    });

    const requestId = response.headers.get("x-request-id") || response.headers.get("openai-request-id") || "";
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({
        error: openAIErrorMessage(data, response.status),
        diagnostics: { endpoint: "/v1/images/edits", status: response.status, requestId, model }
      }, { status: response.status });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "OpenAI merespons tetapi tidak mengembalikan gambar hasil.", diagnostics: { requestId, model } }, { status: 502 });
    }

    return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}`, diagnostics: { requestId, model } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Terjadi kesalahan pada image edit." }, { status: 500 });
  }
}
