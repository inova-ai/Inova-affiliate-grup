import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageUrl, gender = "wanita", style = "fashion catalog" } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: "imageUrl wajib diisi." }, { status: 400 });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "OPENAI_API_KEY belum dikonfigurasi." }, { status: 500 });

    const prompt = `Create a realistic full-body commercial fashion model wearing the exact clothing product shown in the reference image. ${gender === "pria" ? "Use an adult male model." : "Use an adult female model."} Keep the garment's exact design, color, pattern, logo, material, seams, buttons, zipper, proportions and details. Do not redesign, recolor, remove or add clothing. Place the model in a clean premium studio fashion setting. ${style}. Full body visible, natural anatomy, realistic hands, photorealistic product photography. The clothing is the hero of the image.`;

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        images: [{ image_url: imageUrl }],
        prompt,
        input_fidelity: "high",
        n: 1,
        size: "1024x1536",
        quality: "medium",
        output_format: "png"
      })
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message || "Gagal membuat model pakaian." }, { status: response.status });
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "API gambar tidak mengembalikan hasil." }, { status: 502 });
    return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Clothing generation gagal." }, { status: 500 });
  }
}
