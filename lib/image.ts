/** Réduit une photo choisie dans la galerie en JPEG léger (data URL), pour la stocker gratuitement dans Firestore. */
export async function compressImage(file: File, max = 720, quality = 0.72): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    let q = quality, size = max, out = "";
    for (let k = 0; k < 4; k++) {
      const r = Math.min(1, size / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      out = c.toDataURL("image/jpeg", q);
      if (out.length < 280_000) break;          // ≈ 200 Ko, bien sous la limite de 1 Mo par document
      size = Math.round(size * 0.8); q -= 0.08;
    }
    return out;
  } finally { URL.revokeObjectURL(url); }
}
