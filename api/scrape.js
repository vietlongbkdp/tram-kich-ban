// api/scrape.js — Bóc dữ liệu trang sản phẩm TỪ PHÍA SERVER (không dính CORS)
// GET /api/scrape?url=https://...
// Trả về: { ok, title, desc, price, images[], note }

const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "vi-VN,vi;q=0.9,en;q=0.8",
  "cache-control": "no-cache",
};

module.exports = async (req, res) => {
  const url = req.query.url;
  if (!url || !/^https?:\/\//.test(url)) {
    return res.status(400).json({ ok: false, note: "Thiếu hoặc sai url" });
  }
  try {
    const r = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const html = await r.text();
    if (!html || html.length < 300) {
      return res.status(200).json({ ok: false, note: `Trang trả về rỗng (HTTP ${r.status})` });
    }
    const out = extract(html, url);
    out.ok = !!(out.title || out.images.length);
    out.note = out.ok
      ? `HTTP ${r.status}, ${html.length} bytes`
      : "Tải được trang nhưng không bóc được dữ liệu (SPA render bằng JS) — AI web search sẽ gánh";
    return res.status(200).json(out);
  } catch (e) {
    return res.status(200).json({ ok: false, note: "Không tải được trang: " + e.message });
  }
};

function extract(html, baseUrl) {
  const out = { title: null, desc: null, price: null, images: [] };

  const meta = (name) => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
      "i"
    );
    const m = html.match(re);
    return m ? (m[1] || m[2]) : null;
  };

  out.title = meta("og:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || null;
  out.desc = meta("og:description") || meta("description");
  const ogimg = meta("og:image");
  if (ogimg) out.images.push(ogimg);

  // JSON-LD Product
  const ldBlocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of ldBlocks) {
    try {
      const raw = block.replace(/<script[^>]*>|<\/script>/gi, "");
      let j = JSON.parse(raw);
      if (Array.isArray(j)) j = j.find((x) => x["@type"] === "Product") || j[0];
      if (j && (j["@type"] === "Product" || j.name)) {
        out.title = out.title || j.name;
        out.desc = out.desc || j.description;
        const offers = Array.isArray(j.offers) ? j.offers[0] : j.offers;
        if (offers && offers.price) {
          out.price = offers.price + (offers.priceCurrency ? " " + offers.priceCurrency : "");
        }
        let imgs = j.image;
        if (typeof imgs === "string") imgs = [imgs];
        if (Array.isArray(imgs)) out.images.push(...imgs);
      }
    } catch (e) {}
  }

  // Shopee inline JSON: "images":["hash1","hash2",...]
  const sh = html.match(/"images"\s*:\s*\[([^\]]+)\]/);
  if (sh) {
    const hashes = [...sh[1].matchAll(/"([a-f0-9-]{20,})"/g)].map((m) => m[1]).slice(0, 12);
    hashes.forEach((h) => out.images.push(`https://down-vn.img.susercontent.com/file/${h}`));
  }

  // Ảnh CDN sản phẩm phổ biến (Shopee/TikTok/Lazada)
  const cdnRe =
    /https?:\/\/[^"'\s\\]+?(?:susercontent\.com|ibyteimg\.com|tiktokcdn[^"'\s\\]*?|lzd-img[^"'\s\\]*?)\/[^"'\s\\]+?\.(?:jpe?g|png|webp)/gi;
  (html.match(cdnRe) || []).slice(0, 24).forEach((u) => out.images.push(u));

  // Thẻ img thường (loại logo/icon)
  const imgRe = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
  let m;
  while ((m = imgRe.exec(html)) && out.images.length < 30) {
    const s = m[1];
    if (!/logo|icon|sprite|avatar|\.svg|pixel|1x1/i.test(s)) out.images.push(s);
  }

  out.images = [...new Set(out.images)].slice(0, 24);
  if (out.title) out.title = out.title.trim().slice(0, 300);
  if (out.desc) out.desc = out.desc.trim().slice(0, 1500);
  return out;
}
