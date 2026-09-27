import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

export const runtime = "nodejs";
const ROUTE_VERSION = "19.0-hf";
const MODEL = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.2-dev";

function getHFToken() {
  return (process.env.HF_TOKEN || "").trim().replace(/^Bearer\s+/i, "").replace(/^[\"']|[\"']$/g, "");
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try { return JSON.stringify(error); } catch { return "Hugging Face image generation gagal."; }
}

export async function POST(req: Request) {
  try {
    const token = getHFToken();
    if (!token) {
      return NextResponse.json({ error: "HF_TOKEN belum dikonfigurasi di Netlify. Buat Hugging Face token dengan izin Inference Providers, lalu tambahkan sebagai HF_TOKEN." }, { status: 500, headers: { "x-inova-pose-route": ROUTE_VERSION } });
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl = String(body?.imageUrl || "").trim();
    const pose = String(body?.pose || "").trim();
    if (!imageUrl || !pose) return NextResponse.json({ error: "imageUrl dan pose wajib diisi." }, { status: 400, headers: { "x-inova-pose-route": ROUTE_VERSION } });

    const sourceResponse = await fetch(imageUrl, { cache: "no-store" });
    if (!sourceResponse.ok) return NextResponse.json({ error: `Gagal mengambil foto sumber dari Cloudinary (HTTP ${sourceResponse.status}).` }, { status: 502, headers: { "x-inova-pose-route": ROUTE_VERSION } });
    const sourceBlob = await sourceResponse.blob();
    if (!sourceBlob.size) return NextResponse.json({ error: "Foto sumber kosong atau tidak dapat dibaca." }, { status: 422, headers: { "x-inova-pose-route": ROUTE_VERSION } });

    const contentType = (sourceResponse.headers.get("content-type") || sourceBlob.type || "image/jpeg").split(";")[0].toLowerCase();
    const prompt = [
      "Edit the supplied fashion/product photo into the requested new pose.",
      "Preserve the same adult person, exact face, facial features, hairstyle, skin tone, body proportions, clothing items, colors, patterns, logos, fabric and accessories.",
      "Change primarily the body pose while keeping the product and identity consistent. Keep realistic anatomy, hands and feet.",
      pose,
      "Premium commercial fashion catalog photography, clean simple studio background, full body visible when possible.",
      "One person only. No duplicate person, no extra limbs, no text, no watermark, no collage."
    ].join(" ");

    const hf = new InferenceClient(token);
    const output = await hf.imageTextToImage({
      model: MODEL,
      provider: "auto",
      inputs: sourceBlob,
      parameters: {
        prompt,
        negative_prompt: "duplicate person, extra limbs, deformed hands, distorted face, changed clothing, text, watermark, collage, split screen",
        target_size: { width: 768, height: 1024 }
      }
    });

    const outputBytes = Buffer.from(await output.arrayBuffer());
    if (!outputBytes.length) throw new Error("Hugging Face tidak mengembalikan gambar.");
    return NextResponse.json({ imageUrl: `data:image/png;base64,${outputBytes.toString("base64")}`, diagnostics: { model: MODEL, routeVersion: ROUTE_VERSION, provider: "auto" } }, { headers: { "x-inova-pose-route": ROUTE_VERSION } });
  } catch (error) {
    const message = errorMessage(error);
    const status = /401|403|unauthorized|forbidden|token/i.test(message) ? 401 : 502;
    return NextResponse.json({ error: `Hugging Face 3 Pose gagal: ${message}` }, { status, headers: { "x-inova-pose-route": ROUTE_VERSION } });
  }
}
