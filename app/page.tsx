"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ArrowDownToLine, Check, ChevronDown, Clapperboard, Copy, Crown,
  FileText, Home as HomeIcon, Image as ImageIcon, Instagram, Play, Settings, Shirt,
  Sparkles, Upload, WandSparkles, X, Youtube, Zap
} from "lucide-react";

type PoseResult = {
  label: string;
  status: "idle" | "processing" | "ready" | "failed";
  imageUrl?: string;
  error?: string;
};

type Result = {
  hook: string;
  caption: string;
  description: string;
  script: string;
  cta: string;
  vigglePrompt: string;
  viggleSettings: string;
  videoUrl?: string;
};

const demoResult: Result = {
  hook: "Stop scroll! Ternyata produk ini punya fitur yang bikin hidup jauh lebih praktis.",
  caption: "Kalau kamu lagi cari produk yang praktis dan terlihat premium, ini wajib masuk wishlist. ✨",
  description: "Konten affiliate siap dipakai untuk TikTok, Reels, dan Shorts. Sesuaikan CTA dan harga sesuai produk yang kamu promosikan.",
  script: "0–3s: tampilkan produk + hook kuat.\n3–8s: tampilkan gerakan utama dari video referensi.\n8–14s: sorot detail dan manfaat produk.\n14–18s: CTA — cek link produk sekarang.",
  cta: "Cek produknya sekarang dan lihat detailnya.",
  vigglePrompt: "Preserve the product appearance from the source image. Transfer the full-body motion, timing and camera rhythm from the driving video naturally. Keep the product centered, realistic, sharp and commercially presentable. Avoid distortion, extra limbs, flicker and identity changes.",
  viggleSettings: "Mode: Video Remix (JST-2)\nCharacters: 1\nOutput: 9:16 vertical\nUse the uploaded product/character image as the source and the uploaded reference video as the driving motion.",
};

const poseLabels = ["Pose 01 • Berdiri", "Pose 02 • 3/4", "Pose 03 • Duduk"];

export default function Home() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [reference, setReference] = useState<File | null>(null);
  const [refUrl, setRefUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [tone, setTone] = useState("Luxury & persuasive");
  const [platform, setPlatform] = useState("TikTok / Reels");
  const [studioMode, setStudioMode] = useState<"video" | "poses" | "clothing">("video");
  const [clothingGender, setClothingGender] = useState("wanita");
  const [clothingStyle, setClothingStyle] = useState("Fashion catalog premium");
  const [clothingModelUrl, setClothingModelUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [copied, setCopied] = useState("");
  const [poseGenerating, setPoseGenerating] = useState(false);
  const [combinedPoseUrl, setCombinedPoseUrl] = useState("");
  const [activeTab, setActiveTab] = useState("studio");
  const [showFaq, setShowFaq] = useState(false);
  const [history, setHistory] = useState<Array<{id:string; type:string; name:string; createdAt:string; status:string; url?:string}>>([]);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState("");

  const previewLabel = useMemo(() => photo ? photo.name : "Belum ada foto", [photo]);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("inova-history") || "[]")); } catch {}
  }, []);

  function saveHistory(item: {type:string; name:string; status:string; url?:string}) {
    const next = [{ ...item, id: crypto.randomUUID(), createdAt: new Date().toLocaleString("id-ID") }, ...history].slice(0, 20);
    setHistory(next);
    localStorage.setItem("inova-history", JSON.stringify(next));
  }

  function clearHistory() { setHistory([]); localStorage.removeItem("inova-history"); setNotice("Riwayat dibersihkan"); window.setTimeout(() => setNotice(""), 1800); }

  function setImage(file: File | undefined) {
    if (!file) return;
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
    setVideoReady(false);
    setResult(null);
    setCombinedPoseUrl("");
  }

  function setReferenceVideo(file: File | undefined) {
    if (!file) return;
    setReference(file);
    setRefUrl(URL.createObjectURL(file));
  }

  async function uploadToCloudinary(file: File, resourceType: "image" | "video") {
    const configResponse = await fetch("/api/config", { cache: "no-store" });
    const config = await configResponse.json().catch(() => ({}));
    const cloudName = String(config?.cloudinary?.cloudName || "");
    const preset = String(config?.cloudinary?.uploadPreset || "");
    if (!configResponse.ok || !cloudName || !preset) {
      throw new Error(config?.error || "Cloudinary belum dikonfigurasi di Netlify (cloud name + unsigned upload preset).");
    }
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const response = await fetch(endpoint, { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || !data.secure_url) throw new Error(data.error?.message || "Upload media gagal.");
    return data.secure_url as string;
  }

  async function generateVideo() {
    if (!photo || !reference) return;
    setUploading(true);
    setProgress(10);
    try {
      const [imageUrl, motionVideoUrl] = await Promise.all([
        uploadToCloudinary(photo, "image"),
        uploadToCloudinary(reference, "video"),
      ]);
      setProgress(28);
      const create = await fetch("/api/viggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, motionVideoUrl }),
      });
      const data = await create.json();
      if (!create.ok) throw new Error(data.error || "Viggle gagal menerima pekerjaan");
      const renderId = data.id;
      setProgress(40);
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`/api/viggle?id=${encodeURIComponent(renderId)}`);
        const status = await statusRes.json();
        setProgress(Math.min(95, 40 + Math.round((i / 60) * 55)));
        if (!statusRes.ok) throw new Error(status.error || "Gagal membaca status Viggle");
        if (status.status === "ready" && status.video_url) {
          setVideoReady(true);
          setResult((prev: Result | null) => prev ? { ...prev, videoUrl: status.video_url } : prev);
          setProgress(100);
          saveHistory({ type: "Video Motion", name: productName || photo.name, status: "READY", url: status.video_url });
          return;
        }
        if (["failed", "cancelled"].includes(status.status)) throw new Error(status.error || `Viggle: ${status.status}`);
      }
      throw new Error("Video masih diproses. Coba cek lagi beberapa saat kemudian.");
    } catch (error) {
      setVideoReady(false);
      setNotice(error instanceof Error ? error.message : "Generate video gagal");
      setResult((prev: Result | null) => prev ? { ...prev, description: `${prev.description}\n\nViggle: ${error instanceof Error ? error.message : "Gagal membuat video"}` } : prev);
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 900);
    }
  }

  async function generateClothingVideo() {
    if (!photo) {
      document.getElementById("photo-input")?.click();
      return;
    }
    setLoading(true);
    setUploading(true);
    setResult(null);
    setVideoReady(false);
    setProgress(8);
    try {
      const clothingUrl = await uploadToCloudinary(photo, "image");
      setProgress(20);
      const modelRes = await fetch("/api/clothing-model", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: clothingUrl, gender: clothingGender, style: clothingStyle })
      });
      const modelData = await modelRes.json();
      if (!modelRes.ok) throw new Error(modelData.error || "Gagal membuat model yang memakai pakaian.");
      setClothingModelUrl(modelData.imageUrl);
      setProgress(42);
      const modelBlob = await fetch(modelData.imageUrl).then(r => r.blob());
      const modelFile = new File([modelBlob], "inova-clothing-model.png", { type: "image/png" });
      const modelPublicUrl = await uploadToCloudinary(modelFile, "image");
      setProgress(55);
      const create = await fetch("/api/viggle", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: modelPublicUrl, clothingMode: true })
      });
      const data = await create.json();
      if (!create.ok) throw new Error(data.error || "Viggle gagal menerima pekerjaan.");
      const renderId = data.id;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`/api/viggle?id=${encodeURIComponent(renderId)}`);
        const status = await statusRes.json();
        setProgress(Math.min(95, 55 + Math.round((i / 60) * 40)));
        if (!statusRes.ok) throw new Error(status.error || "Gagal membaca status Viggle.");
        if (status.status === "ready" && status.video_url) {
          const clothingResult: Result = {
            hook: "Lihat bagaimana pakaian ini tampil saat dipakai model.",
            caption: `Video fashion ${productName || "produk pakaian"} siap untuk konten affiliate.`,
            description: "AI membuat model mengenakan produk dari foto pakaian lalu mengubahnya menjadi video fashion.",
            script: "0–3s: tampilkan model dan pakaian.\n3–7s: model bergerak natural.\n7–10s: sorot detail pakaian.\n10–12s: CTA — cek produk sekarang.",
            cta: "Cek produk dan detail ukurannya sekarang.",
            vigglePrompt: "Fashion product video. Preserve the exact garment design, color, pattern, logo, material and construction while the adult model moves naturally. Keep anatomy realistic, garment stable, sharp and commercially presentable.",
            viggleSettings: "Mode: Clothing → Video\nModel: AI fashion model\nMotion: preset fashion motion\nOutput: 9:16 vertical",
            videoUrl: status.video_url
          };
          setResult(clothingResult);
          setVideoReady(true);
          setProgress(100);
          saveHistory({ type: "Clothing → Video", name: productName || photo.name, status: "READY", url: status.video_url });
          return;
        }
        if (["failed", "cancelled"].includes(status.status)) throw new Error(status.error || `Viggle: ${status.status}`);
      }
      throw new Error("Video masih diproses. Coba cek lagi beberapa saat kemudian.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Clothing → Video gagal.");
    } finally {
      setLoading(false);
      setUploading(false);
      window.setTimeout(() => setProgress(0), 900);
    }
  }

  async function generate() {
    if (!photo) {
      document.getElementById("photo-input")?.click();
      return;
    }
    setLoading(true);
    setResult(null);
    setVideoReady(false);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, tone, platform }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat content pack");
      setResult(data.result);
      if (reference) await generateVideo();
    } catch (error) {
      setResult({ ...demoResult, description: error instanceof Error ? error.message : demoResult.description });
    } finally {
      setLoading(false);
    }
  }

  async function combineThreePoseImages(urls: string[]) {
    if (urls.length !== 3) throw new Error("Tiga hasil pose belum tersedia.");
    const canvas = document.createElement("canvas");
    const size = 1200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Browser tidak mendukung canvas.");

    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal menyiapkan foto gabungan."));
      img.src = src;
    });

    const images = await Promise.all(urls.map(load));
    ctx.clearRect(0, 0, size, size);
    images.forEach((img, index) => {
      const x = Math.floor(index * size / 3);
      const nextX = Math.floor((index + 1) * size / 3);
      const w = nextX - x;
      // Cover-crop each portrait into its equal vertical panel, like the reference image.
      const scale = Math.max(w / img.naturalWidth, size / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = x + (w - dw) / 2;
      const dy = (size - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    });
    return canvas.toDataURL("image/jpeg", 0.94);
  }

  async function generateThreePoses() {
    if (!photo) {
      document.getElementById("photo-input")?.click();
      return;
    }
    setPoseGenerating(true);
    setProgress(8);
    setPoseResults((prev: PoseResult[]) => prev.map((p: PoseResult) => ({ ...p, status: "processing", error: undefined, imageUrl: undefined })));
    try {
      // Preflight the same server environment used by /api/pose-edit.
      // This prevents a stale/old Netlify function from being mistaken for an API-key problem.
      const healthResponse = await fetch("/api/health", { cache: "no-store" });
      const health = await healthResponse.json().catch(() => ({}));
      if (!healthResponse.ok || !health?.environment?.openaiAuthenticated || !health?.environment?.openaiImageModel) {
        throw new Error(health?.environment?.openaiError || "OpenAI belum siap di deployment ini. Buka /api/health dan redeploy setelah environment variable diperbarui.");
      }
      const imageUrl = await uploadToCloudinary(photo, "image");
      setProgress(22);
      const prompts = [
        "Pose 1: full-body fashion product pose, standing straight facing the camera, natural relaxed arms, clean commercial catalog posture.",
        "Pose 2: full-body fashion product pose, standing in a natural three-quarter angle, one leg slightly forward, subtle confident posture, keep the outfit fully visible.",
        "Pose 3: full-body fashion product pose, seated naturally on a simple studio stool, relaxed elegant posture, keep the entire outfit visible.",
      ];
      const results = await Promise.all(prompts.map(async (prompt, index) => {
        try {
          const response = await fetch("/api/pose-edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl, pose: prompt }),
          });
          const data = await response.json();
          const routeVersion = response.headers.get("x-inova-pose-route");
          if (!response.ok) {
            const detail = data.error || "Gagal membuat pose.";
            if (!routeVersion) {
              throw new Error(`${detail} — Server pose yang aktif masih versi lama. Redeploy ZIP V18.7 ini di Netlify.`);
            }
            throw new Error(detail);
          }
          if (routeVersion !== "18.7") {
            throw new Error("Server pose belum menggunakan versi V18.7. Silakan redeploy ZIP terbaru di Netlify.");
          }
          return { index, imageUrl: data.imageUrl as string };
        } catch (error) {
          return { index, error: error instanceof Error ? error.message : "Gagal membuat pose." };
        }
      }));
      const ready = results.filter(r => !r.error && r.imageUrl);
      setProgress(78);
      setPoseResults((prev: PoseResult[]) => prev.map((pose: PoseResult, index: number) => {
        const r = results[index];
        return r.error ? { ...pose, status: "failed", error: r.error } : { ...pose, status: "ready", imageUrl: r.imageUrl };
      }));

      // The requested output is ONE square image with three equal vertical panels.
      if (ready.length === 3) {
        const combined = await combineThreePoseImages(ready.map(r => r.imageUrl as string));
        setCombinedPoseUrl(combined);
        saveHistory({ type: "3 Pose • 1 Foto", name: productName || photo.name, status: "READY", url: combined });
      } else if (ready.length) {
        setCombinedPoseUrl("");
        saveHistory({ type: "3 Pose", name: productName || photo.name, status: `${ready.length}/3 READY` });
      }
      setProgress(100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload produk gagal.";
      setPoseResults((prev: PoseResult[]) => prev.map((p: PoseResult) => ({ ...p, status: "failed", error: message })));
    } finally {
      setPoseGenerating(false);
      window.setTimeout(() => setProgress(0), 900);
    }
  }

  const [poseResults, setPoseResults] = useState<PoseResult[]>(poseLabels.map(label => ({ label, status: "idle" })));

  async function copyText(text: string, label = "Teks") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {}
  }

  function exportContentPack() {
    if (!result) return;
    const pack = [
      "INOVA AFFILIATE GRUP — CONTENT PACK", "",
      `Produk: ${productName || "Produk affiliate"}`, `Platform: ${platform}`, `Tone: ${tone}`, "",
      "HOOK", result.hook, "", "CAPTION", result.caption, "", "DESKRIPSI", result.description,
      "", "CTA", result.cta, "", "SCRIPT", result.script, "", "VIGGLE SETTINGS", result.viggleSettings,
      "", "VIGGLE PROMPT", result.vigglePrompt,
    ].join("\n");
    const blob = new Blob([pack], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inova-${(productName || "affiliate").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const nav = (tab: string) => {
    setActiveTab(tab);
    const id = tab === "home" ? "home" : tab === "studio" ? "studio" : "settings";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="app-shell">
      <div className="app-bg" />

      <header className="appbar">
        <div className="appbar-inner">
          <div className="brand-mini">
            <div className="brand-icon"><Sparkles className="h-4 w-4" /></div>
            <div>
              <div className="brand-name">INOVA</div>
              <div className="brand-sub">AFFILIATE AI</div>
            </div>
          </div>
          <div className="app-status"><span className="status-dot" /> AI Studio</div>
          <button className="icon-button" onClick={() => document.getElementById("settings")?.scrollIntoView({behavior:"smooth"})} aria-label="Pengaturan"><Settings className="h-4 w-4" /></button>
        </div>
      </header>
      {progress > 0 && <div className="global-progress"><div style={{ width: `${progress}%` }} /><span>{progress < 100 ? `AI sedang bekerja… ${progress}%` : "Selesai"}</span></div>}
      {notice && <div className="toast-notice">{notice}</div>}

      <div className="app-layout">
        <aside className="side-rail">
          <button onClick={() => nav("home")} className={activeTab === "home" ? "rail-item active" : "rail-item"}><HomeIcon className="h-4 w-4" /><span>Beranda</span></button>
          <button onClick={() => nav("studio")} className={activeTab === "studio" ? "rail-item active" : "rail-item"}><WandSparkles className="h-4 w-4" /><span>AI Studio</span></button>
          <button onClick={() => document.getElementById("history")?.scrollIntoView({behavior:"smooth"})} className="rail-item"><FileText className="h-4 w-4" /><span>Riwayat</span></button>
          <div className="rail-spacer" />
          <div className="rail-pro"><Crown className="h-4 w-4 text-gold" /><span>Creator</span></div>
        </aside>

        <div className="app-content">
          <section id="home" className="screen-header">
            <div>
              <div className="eyebrow">CREATOR WORKSPACE</div>
              <h1>Selamat datang di <span className="gold-text">Inova</span></h1>
              <p>Buat aset affiliate dari satu foto tanpa berpindah-pindah aplikasi.</p>
            </div>
            <div className="credit-pill"><Zap className="h-3.5 w-3.5" /> AI Ready</div>
          </section>

          <section className="quick-actions">
            <button className="quick-card primary" onClick={() => { setStudioMode("video"); nav("studio"); }}>
              <div className="quick-icon"><Clapperboard className="h-5 w-5" /></div>
              <div><b>Foto + Video → Video</b><span>Ikuti gerakan referensi dengan Viggle</span></div>
              <span className="quick-arrow">›</span>
            </button>
            <button className="quick-card" onClick={() => { setStudioMode("poses"); nav("studio"); }}>
              <div className="quick-icon"><ImageIcon className="h-5 w-5" /></div>
              <div><b>1 Foto → 3 Pose</b><span>Wajah & pakaian tetap konsisten</span></div>
              <span className="quick-arrow">›</span>
            </button>
            <button className="quick-card" onClick={() => { setStudioMode("clothing"); nav("studio"); }}>
              <div className="quick-icon"><Shirt className="h-5 w-5" /></div>
              <div><b>Clothing → Video</b><span>Foto pakaian → model → video fashion</span></div>
              <span className="quick-arrow">›</span>
            </button>
          </section>

          <section id="studio" className="studio-card">
            <div className="studio-topbar">
              <div><div className="eyebrow">AI STUDIO</div><h2>Workspace</h2></div>
              <div className="secure-chip"><Check className="h-3 w-3" /> Ready</div>
            </div>

            <div className="mode-tabs">
              <button onClick={() => setStudioMode("video")} className={studioMode === "video" ? "mode-tab active" : "mode-tab"}><Clapperboard className="h-4 w-4" /><span><b>Video Motion</b><small>Foto + referensi</small></span></button>
              <button onClick={() => setStudioMode("poses")} className={studioMode === "poses" ? "mode-tab active" : "mode-tab"}><ImageIcon className="h-4 w-4" /><span><b>3 Pose</b><small>Satu foto</small></span></button>
              <button onClick={() => setStudioMode("clothing")} className={studioMode === "clothing" ? "mode-tab active" : "mode-tab"}><Shirt className="h-4 w-4" /><span><b>Clothing</b><small>Pakaian → video</small></span></button>
            </div>

            <div className="studio-grid">
              <div className="input-stack">
                <label className="upload-box">
                  <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => setImage(e.target.files?.[0])} />
                  <div className="media-preview">
                    {photoUrl ? <img src={photoUrl} alt="Preview" /> : <div className="upload-empty"><div className="upload-icon"><Upload className="h-5 w-5" /></div><b>Tambah foto produk</b><span>PNG, JPG atau WEBP</span></div>}
                  </div>
                  <div className="upload-meta"><span>{previewLabel}</span>{photo && <button type="button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); setPhoto(null); setPhotoUrl(""); }}><X className="h-4 w-4" /></button>}</div>
                </label>

                {studioMode === "video" ? (
                  <label className="ref-box">
                    <input type="file" accept="video/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => setReferenceVideo(e.target.files?.[0])} />
                    <div className="ref-icon"><Play className="h-4 w-4 fill-current" /></div>
                    <div className="ref-copy"><b>Video referensi</b><span>{reference ? reference.name : "Pilih video gerakan yang ingin diikuti"}</span></div>
                    <Upload className="h-4 w-4 text-white/30" />
                  </label>
                ) : studioMode === "poses" ? (
                  <div className="helper-card"><Sparkles className="h-4 w-4 text-gold" /><div><b>3 pose otomatis</b><span>AI mempertahankan wajah, rambut, warna, motif, pakaian, aksesori dan proporsi.</span></div></div>
                ) : (
                  <div className="clothing-options">
                    <div className="helper-card"><Shirt className="h-4 w-4 text-gold" /><div><b>Clothing → Video</b><span>Upload foto pakaian. AI membuat model dewasa yang mengenakannya lalu membuat video fashion otomatis.</span></div></div>
                    <div className="field-grid">
                      <label><span>Model</span><select value={clothingGender} onChange={(e: ChangeEvent<HTMLSelectElement>) => setClothingGender(e.target.value)}><option value="wanita">Wanita</option><option value="pria">Pria</option></select></label>
                      <label><span>Gaya</span><select value={clothingStyle} onChange={(e: ChangeEvent<HTMLSelectElement>) => setClothingStyle(e.target.value)}><option>Fashion catalog premium</option><option>Streetwear editorial</option><option>Marketplace clean</option><option>Luxury studio</option></select></label>
                    </div>
                  </div>
                )}

                <div className="field-grid">
                  <label><span>Nama produk</span><input value={productName} onChange={(e: ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)} placeholder="Contoh: Smartwatch X1" /></label>
                  <label><span>Tone</span><select value={tone} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTone(e.target.value)}><option>Luxury & persuasive</option><option>Casual & relatable</option><option>Energetic & viral</option><option>Clean & professional</option></select></label>
                </div>
                <label className="field-wide"><span>Target platform</span><select value={platform} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPlatform(e.target.value)}><option>TikTok / Reels</option><option>YouTube Shorts</option><option>Instagram</option><option>Marketplace Video</option></select></label>

                {studioMode === "video" ? (
                  <button onClick={generate} disabled={loading || uploading} className="generate-button">{loading || uploading ? "Memproses…" : <>Generate Video <Sparkles className="h-4 w-4" /></>}</button>
                ) : studioMode === "poses" ? (
                  <button onClick={generateThreePoses} disabled={poseGenerating || uploading} className="generate-button">{poseGenerating ? "Membuat 3 pose…" : <>Generate 3 Pose <Sparkles className="h-4 w-4" /></>}</button>
                ) : (
                  <button onClick={generateClothingVideo} disabled={loading || uploading} className="generate-button">{loading || uploading ? "Membuat model & video…" : <>Generate Clothing Video <Shirt className="h-4 w-4" /></>}</button>
                )}
              </div>

              <div className="result-panel">
                {studioMode === "poses" ? (
                  <div className="result-inner">
                    <div className="result-title"><div><div className="eyebrow">OUTPUT</div><h3>3 Pose • 1 Foto</h3></div><span>{poseResults.filter(p => p.status === "ready").length}/3 siap</span></div>
                    <div className="combined-pose-wrap">
                      {combinedPoseUrl ? (
                        <>
                          <img className="combined-pose-image" src={combinedPoseUrl} alt="3 pose dalam 1 foto" />
                          <a href={combinedPoseUrl} download="inova-3-pose-1-foto.jpg" className="download-main"><ArrowDownToLine className="h-4 w-4" /> Download 1 Foto</a>
                        </>
                      ) : (
                        <div className="combined-pose-placeholder">
                          <div className="combined-pose-panels">
                            {poseResults.map((pose) => <div className="combined-pose-panel" key={pose.label}>{pose.imageUrl ? <img src={pose.imageUrl} alt={pose.label} /> : photoUrl ? <img src={photoUrl} alt="Preview" className="ghost" /> : <span>Preview</span>}{pose.status === "processing" && <div className="processing">GENERATING…</div>}</div>)}
                          </div>
                          {poseResults.some(p => p.error) && <small className="error-text">{poseResults.find(p => p.error)?.error}</small>}
                          {!poseResults.some(p => p.error) && <small>Setelah 3 pose selesai, otomatis digabung menjadi 1 foto seperti contoh.</small>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="result-inner">
                    {!result ? (
                      <div className="empty-result"><div className="result-logo"><WandSparkles className="h-7 w-7" /></div><h3>Hasil akan muncul di sini</h3><p>{studioMode === "clothing" ? "Upload foto pakaian, pilih model, lalu tekan Generate. AI akan membuat model yang mengenakan pakaian dan video fashion." : "Upload foto dan video referensi, lalu tekan Generate. Content pack dan video Viggle akan tampil di panel ini."}</p><div className="mini-stats"><span><b>01</b> Foto</span><span><b>02</b> Referensi</span><span><b>03</b> Generate</span></div></div>
                    ) : (
                      <div className="result-scroll">
                        <div className="result-title"><div><div className="eyebrow">CONTENT PACK</div><h3>Hasil Generasi</h3></div><span className={videoReady ? "ready" : "running"}>{videoReady ? "READY" : "PROCESSING"}</span></div>
                        <div className="video-preview">{videoReady && result.videoUrl ? <video src={result.videoUrl} controls playsInline /> : clothingModelUrl && studioMode === "clothing" ? <img src={clothingModelUrl} alt="AI model wearing clothing" /> : photoUrl ? <img src={photoUrl} alt="Preview" /> : null}<div className="preview-label">{videoReady ? "VIDEO • READY" : studioMode === "clothing" && clothingModelUrl ? "AI MODEL • READY FOR VIDEO" : "AI • PROCESSING"}</div></div>
                        {[['HOOK', result.hook], ['CAPTION', result.caption], ['DESKRIPSI', result.description], ['CTA', result.cta], ['SCRIPT', result.script]].map(([label, text]) => <div className="text-card" key={label}><div className="text-card-head"><b>{label}</b><button onClick={() => copyText(text, label)}><Copy className="h-3 w-3" />{copied === label ? "Copied" : "Copy"}</button></div><p>{text}</p></div>)}
                        <div className="viggle-box"><div className="text-card-head"><b>VIGGLE VIDEO REMIX</b><span>$0.01/detik</span></div><p>{result.viggleSettings}</p><div className="prompt-box"><div className="text-card-head"><span>PROMPT</span><button onClick={() => copyText(result.vigglePrompt, "Prompt")}><Copy className="h-3 w-3" />{copied === "Prompt" ? "Copied" : "Copy"}</button></div><p>{result.vigglePrompt}</p></div>{videoReady && result.videoUrl && <a href={result.videoUrl} target="_blank" rel="noreferrer" className="download-main"><ArrowDownToLine className="h-4 w-4" /> Download Video</a>}</div>
                        <div className="result-actions"><button onClick={() => copyText(result.vigglePrompt, "Prompt")}> <Copy className="h-4 w-4" /> Copy Prompt</button><button onClick={exportContentPack}>Export Pack</button></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {refUrl && studioMode === "video" && <div className="reference-preview"><video src={refUrl} controls /><div><b>Video referensi aktif</b><span>Gerakan ini akan dikirim sebagai driving motion ke Viggle.</span></div></div>}

          <section id="history" className="history-section">
            <div className="section-head"><div><div className="eyebrow">LIBRARY</div><h2>Riwayat & Galeri</h2><p>Hasil generate terakhir tersimpan di perangkat ini.</p></div><button className="ghost-btn" onClick={clearHistory}>Bersihkan</button></div>
            {history.length === 0 ? <div className="history-empty"><ImageIcon className="h-5 w-5"/><span>Belum ada hasil. Generate dari AI Studio untuk mengisi galeri.</span></div> : <div className="history-grid">{history.map(item => <div className="history-card" key={item.id}><div className="history-thumb">{item.url ? <video src={item.url} controls playsInline /> : <ImageIcon className="h-6 w-6"/>}<span>{item.status}</span></div><b>{item.type}</b><small>{item.name}</small><small>{item.createdAt}</small>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="download-small"><ArrowDownToLine className="h-3.5 w-3.5"/> Buka hasil</a>}</div>)}</div>}
          </section>

          <section id="settings" className="app-info-grid">
            <div className="info-card"><div className="info-icon"><Zap className="h-4 w-4" /></div><div><b>Workflow cepat</b><span>Satu workspace untuk video motion dan 3 pose.</span></div></div>
            <div className="info-card"><div className="info-icon"><Crown className="h-4 w-4" /></div><div><b>Premium UI</b><span>Dirancang seperti creative app, bukan landing page.</span></div></div>
            <div className="info-card"><div className="info-icon"><FileText className="h-4 w-4" /></div><div><b>Content pack</b><span>Hook, caption, CTA dan script siap disalin.</span></div></div>
          </section>

          {showFaq && <section className="faq-card"><div className="eyebrow">PANDUAN</div><h2>Cara kerja</h2>{[
            ["Clothing → Video", "Foto pakaian diproses menjadi gambar model dewasa yang mengenakan pakaian tersebut, lalu dianimasikan menjadi video fashion menggunakan motion preset."],
            ["Foto + Video → Video", "Satu foto + satu video referensi dikirim ke Viggle Video Remix untuk menghasilkan video yang mengikuti gerakan referensi."],
            ["1 Foto → 3 Pose", "Satu foto diedit menjadi tiga pose lalu otomatis digabung menjadi satu foto square dengan tiga panel vertikal."],
            ["Apakah video referensi wajib?", "Ya untuk workflow Video Motion. Workflow 3 Pose tidak memerlukan video referensi."],
          ].map(([q, a]) => <details key={q}><summary>{q}<ChevronDown className="h-4 w-4" /></summary><p>{a}</p></details>)}</section>}

          <footer className="app-footer"><span>© 2026 INOVA AFFILIATE GRUP</span><span><Instagram className="h-3.5 w-3.5" /><Youtube className="h-3.5 w-3.5" /></span></footer>
        </div>
      </div>

      <nav className="bottom-nav">
        <button onClick={() => nav("home")} className={activeTab === "home" ? "bottom-item active" : "bottom-item"}><HomeIcon className="h-5 w-5" /><span>Home</span></button>
        <button onClick={() => nav("studio")} className={activeTab === "studio" ? "bottom-item active" : "bottom-item"}><WandSparkles className="h-5 w-5" /><span>Create</span></button>
        <button onClick={() => document.getElementById("settings")?.scrollIntoView({behavior:"smooth"})} className="bottom-item"><Settings className="h-5 w-5" /><span>Settings</span></button>
      </nav>
    </main>
  );
}
