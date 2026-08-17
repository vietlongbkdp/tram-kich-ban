// api/generate.js — v3.0: dùng GOOGLE GEMINI API (MIỄN PHÍ qua Google AI Studio)
// Không cần thẻ tín dụng, không hết hạn. Free tier: Flash/Flash-Lite ~1.000-1.500 request/ngày,
// Google Search grounding miễn phí 5.000 lượt/tháng — dư sức cho vài chục sản phẩm/ngày.
// Lấy key miễn phí tại: https://aistudio.google.com/apikey (chỉ cần tài khoản Google)
//
// POST { url, scraped, extra, niche, voice, hookgroup, model:'fast'|'quality', forceSearch:bool }
//
// LOGIC TIẾT KIỆM HẠN MỨC (dù đã free, vẫn có rate limit/ngày nên vẫn nên tiết kiệm):
// - Bóc được trang đủ dữ liệu → TẮT Google Search grounding, trả lời thẳng (nhanh hơn, đỡ tốn lượt search)
// - Trang chặn / thiếu dữ liệu / forceSearch → bật Google Search grounding
// - model 'fast' = Gemini 2.5 Flash-Lite (hạn mức ngày cao nhất), 'quality' = Gemini 2.5 Flash

const MODELS = {
  fast: "gemini-2.5-flash-lite",
  quality: "gemini-2.5-flash",
};

const HOOKS_COMPACT = `1|gia_soc|{gia} mà làm được điều này thì quá vô lý…
2|gia_soc|Đừng bỏ {gia} mua {ten} trước khi xem hết video này
3|gia_soc|Tôi đã nghĩ {ten} là đồ bỏ đi, cho đến khi…
4|gia_soc|Rẻ như này mà xịn vậy, chắc chắn shop nhập nhầm giá
5|noi_dau|Ai hay bực mình vì {van_de} thì dừng lại 30 giây
6|noi_dau|{van_de}? Đây là thứ chấm dứt chuyện đó vĩnh viễn
7|noi_dau|Nhà nào cũng gặp cảnh {van_de} mà không biết cái này tồn tại
8|noi_dau|Tôi chịu đựng {van_de} suốt 2 năm, lẽ ra phải mua cái này sớm hơn
9|to_mo|99% mọi người không biết {ten} còn làm được điều này
10|to_mo|Thứ này đang cháy hàng và đây là lý do
11|to_mo|Vì sao dân kỹ thuật như tôi lại chấm cái này 9/10?
12|to_mo|Cái này là gì mà 10 người xem 8 người mua?
13|to_mo|Xem đến giây thứ 10 là bạn hiểu vì sao nó viral
14|canh_bao|Đừng mua {ten} nếu bạn chưa biết 3 điều này
15|canh_bao|Sự thật về {ten} mà người bán không nói cho bạn
16|canh_bao|Mua {ten} kiểu này là mất tiền oan
17|trai_nghiem|Ngày thứ 30 dùng {ten}: nói thật lòng
18|trai_nghiem|Tôi mua {ten} về test cho mọi người khỏi mất tiền thử
19|trai_nghiem|Trên tay {ten} vừa về: đập hộp và test luôn
20|trai_nghiem|Vợ tôi bảo phí tiền, 1 tuần sau chính vợ tôi dùng nhiều nhất
21|so_sanh|{ten} {gia} đấu với hàng 5 triệu: kết quả gây sốc
22|so_sanh|Cùng công dụng, chênh nhau cả triệu bạc — khác gì nhau?
23|khan_cap|Sắp Tết rồi, nhà nào chưa có {ten} là thiệt
24|khan_cap|Deal này hết hôm nay, tôi nói trước để khỏi tiếc
25|khan_cap|Giá này chỉ còn vài giờ, xem nhanh còn kịp`;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { url, scraped, extra, niche, voice, hookgroup, model, forceSearch } = req.body || {};
  if (!url && !extra) return res.status(400).json({ error: "Cần url hoặc mô tả" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      error: "Thiếu GEMINI_API_KEY. Lấy key MIỄN PHÍ tại aistudio.google.com/apikey rồi điền vào Environment Variables trên Vercel.",
    });
  }

  const hasScraped = !!(scraped && scraped.title && (scraped.desc || scraped.price));
  const useSearch = !!forceSearch || !hasScraped;

  const hookRule =
    !hookgroup || hookgroup === "auto"
      ? "3 phương án thuộc 3 NHÓM hook khác nhau, chọn nhóm hợp sản phẩm nhất."
      : `Phương án 1 BẮT BUỘC nhóm "${hookgroup}"; 2 phương án còn lại dùng 2 nhóm khác.`;

  const ctx = [
    url ? `LINK: ${url}` : null,
    hasScraped
      ? `DỮ LIỆU TRANG (nguồn chính): ${JSON.stringify({
          title: scraped.title,
          desc: (scraped.desc || "").slice(0, 700),
          price: scraped.price,
        })}`
      : "DỮ LIỆU TRANG: không có" + (useSearch ? " → hãy dùng Google Search để lấy thông tin thật" : ""),
    extra ? `NGƯỜI DÙNG BỔ SUNG (ưu tiên cao nhất): ${extra.slice(0, 800)}` : null,
    `NGÁCH: ${niche || "gia dụng"} | GIỌNG: ${voice || "nam"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Bạn là chuyên gia kịch bản video TikTok Shop affiliate VN.

${ctx}

25 HOOK (id|nhóm|mẫu; biến {ten}/{gia}/{van_de}):
${HOOKS_COMPACT}

YÊU CẦU: ${hookRule}
Kịch bản văn nói tự nhiên kiểu review thật (xưng "mình"), không văn quảng cáo, đọc 30-45s (~90-140 từ), kết bằng CTA giỏ hàng vàng góc trái. Thông số phải từ nguồn thật, không chắc thì ghi "cần kiểm tra".

CHỈ TRẢ VỀ JSON, không kèm markdown, không giải thích gì thêm:
{"san_pham":{"ten":"","ten_ngan":"2-4 từ","gia_hien_thi":"vd 790 nghìn","van_de":"nỗi đau, 1 cụm","doi_tuong":"","thong_so":[{"ten":"","gia_tri":""}],"y_chinh":["5 ý bán hàng, văn nói"]},
"kich_ban":[{"ten_phuong_an":"","hook_id":0,"nhom":"","hook":"","noi_dung":"","cta":"","thoi_luong_giay":35},{},{}],
"canh_quay":["5-7 cảnh quay cụ thể"]}`;

  const modelName = MODELS[model] || MODELS.fast;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2400, temperature: 0.9 },
  };
  // Gemini KHÔNG cho kết hợp google_search với các tool khác trong cùng request — ở đây ta chỉ dùng
  // duy nhất search nên không xung đột. Không bật responseMimeType=json khi có tool để tránh lỗi 400
  // trên một số phiên bản model; JSON được ép qua prompt + parse tay bên dưới (ổn định hơn, mọi model).
  if (useSearch) {
    body.tools = [{ google_search: {} }];
  } else {
    body.generationConfig.responseMimeType = "application/json";
  }

  try {
    const t0 = Date.now();
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      }
    );

    if (r.status === 429) {
      return res.status(200).json({
        error: "Đã chạm hạn mức free trong phút/ngày hôm nay (hiếm khi xảy ra với dùng cá nhân) — đợi 1-2 phút rồi thử lại, hoặc dùng chế độ ✍️ Nhập thủ công bên dưới.",
      });
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("Gemini API:", r.status, t.slice(0, 500));
      return res.status(200).json({ error: `Gemini API lỗi ${r.status} — kiểm tra GEMINI_API_KEY trong Environment Variables` });
    }

    const data = await r.json();
    const cand = data.candidates && data.candidates[0];
    if (!cand) {
      return res.status(200).json({ error: "Gemini không trả về nội dung (có thể do bộ lọc an toàn) — thử sửa lại mô tả hoặc dùng chế độ thủ công" });
    }
    const text = (cand.content?.parts || []).map((p) => p.text || "").join("\n");
    const m = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
    if (!m) return res.status(200).json({ error: "AI không trả JSON hợp lệ, bấm chạy lại" });

    const out = JSON.parse(m[0]);
    out._meta = {
      model: modelName,
      searched: useSearch,
      ms: Date.now() - t0,
      usage: data.usageMetadata || null,
      free: true,
    };
    return res.status(200).json(out);
  } catch (e) {
    console.error(e);
    return res.status(200).json({ error: "Lỗi server: " + e.message });
  }
};
