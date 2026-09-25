import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY belum dikonfigurasi di Netlify." }, { status: 500 });
    }

    const body = await req.json();
    const imageUrl = String(body?.imageUrl || "");
    const pose = String(body?.pose || "");

    if (!imageUrl || !pose) {
      return NextResponse.json({ error: "imageUrl dan pose wajib diisi." }, { status: 400 });
    }

    const prompt = [
      "Edit the supplied source fashion/product photo into a new pose while preserving the same person and the same clothing.",
      "Identity preservation is critical: keep the exact same face, facial features, hairstyle, hair color, skin tone, body proportions, age appearance, clothing items, clothing colors, fabric texture, prints, logos and accessories.",
      "Do not redesign, recolor, replace, remove, or add clothing. Do not change the person's identity.",
      "Keep the same overall product/fashion presentation and realistic photography quality. Change primarily the body pose and camera-facing posture.",
      pose,
      "Create a clean commercial fashion catalog photo, realistic anatomy, natural hands and feet, consistent lighting, uncluttered studio background, full body visible when possible.",
      "No collage, no split screen, no extra person, no duplicate limbs, no text, no watermark."
    ].join(" ");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        images: [{ image_url: imageUrl }],
        prompt,
        input_fidelity: "high",
        n: 1,
        size: "1024x1536",
        quality: "medium",
        output_format: "png",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || "OpenAI image edit gagal.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "API tidak mengembalikan gambar hasil." }, { status: 502 });
    }

    return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan pada image edit." },
      { status: 500 }
    );
  }
}
