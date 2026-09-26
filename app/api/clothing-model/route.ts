import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getOpenAIKey() {
  const raw = process.env.OPENAI_API_KEY || "";
  return raw.trim().replace(/^['\"]|['\"]$/g, "");
}

async function verifyOpenAIKey(key: string) {
  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export async function POST(req: Request) {
  try {
    const { imageUrl, gender = "wanita", style = "fashion catalog" } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: "imageUrl wajib diisi." }, { status: 400 });

    const key = getOpenAIKey();
    if (!key) return NextResponse.json({ error: "OPENAI_API_KEY belum dikonfigurasi." }, { status: 500 });

    const authCheck = await verifyOpenAIKey(key);
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: authCheck.data?.error?.message || "OpenAI API key tidak valid atau tidak memiliki akses." },
        { status: authCheck.status }
      );
    }

    const sourceResponse = await fetch(String(imageUrl), { cache: "no-store" });
    if (!sourceResponse.ok) {
      return NextResponse.json({ error: `Gagal mengambil foto pakaian dari Cloudinary (${sourceResponse.status}).` }, { status: 502 });
    }
    const sourceBlob = await sourceResponse.blob();
    const contentType = sourceResponse.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

    const prompt = `Create a realistic full-body commercial fashion model wearing the exact clothing product shown in the reference image. ${gender === "pria" ? "Use an adult male model." : "Use an adult female model."} Keep the garment's exact design, color, pattern, logo, material, seams, buttons, zipper, proportions and details. Do not redesign, recolor, remove or add clothing. Place the model in a clean premium studio fashion setting. ${style}. Full body visible, natural anatomy, realistic hands, photorealistic product photography. The clothing is the hero of the image.`;

    const form = new FormData();
    form.append("model", process.env["OPENAI_IMAGE_MODEL"] || "gpt-image-2");
    form.append("image[]", sourceBlob, `clothing.${extension}`);
    form.append("prompt", prompt);
    form.append("n", "1");
    form.append("size", "1024x1536");
    form.append("quality", "medium");
    form.append("output_format", "png");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || `OpenAI image edit gagal (HTTP ${response.status}).` }, { status: response.status });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "API gambar tidak mengembalikan hasil." }, { status: 502 });
    return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Clothing generation gagal." }, { status: 500 });
  }
}
