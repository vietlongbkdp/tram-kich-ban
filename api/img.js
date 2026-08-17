// api/img.js — Proxy tải ảnh sản phẩm (vượt chặn hotlink/CORS của CDN)
// GET /api/img?u=<url ảnh đã encode>

module.exports = async (req, res) => {
  const u = req.query.u;
  if (!u || !/^https?:\/\//.test(u)) return res.status(400).send("Thiếu u");
  try {
    const r = await fetch(u, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        referer: new URL(u).origin + "/",
        accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return res.status(502).send("CDN từ chối: " + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("content-type", r.headers.get("content-type") || "image/jpeg");
    res.setHeader("cache-control", "public, max-age=86400");
    res.setHeader("access-control-allow-origin", "*");
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).send("Lỗi tải ảnh: " + e.message);
  }
};
