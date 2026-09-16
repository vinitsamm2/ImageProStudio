// Vercel Serverless Function for ImagePro Studio mobile sharing & QR download transfer
const fileStore = new Map();

// Auto-purge items older than 5 minutes (300,000 ms)
const FILE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function purgeExpired() {
  const now = Date.now();
  for (const [id, item] of fileStore.entries()) {
    if (now - item.created > FILE_TTL_MS) {
      fileStore.delete(id);
    }
  }
}

export default async function handler(req, res) {
  purgeExpired();

  // Set CORS headers so mobile devices can access without issues
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-file-name, Range");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${proto}://${hostHeader}`;
  const url = new URL(req.url || "", baseUrl);
  const pathname = url.pathname;

  // GET /api/share/network-info
  if (req.method === "GET" && pathname.includes("/network-info")) {
    return res.status(200).json({
      ip: hostHeader,
      port: proto === "https" ? 443 : 80,
      isCloud: true,
      baseUrl
    });
  }

  // POST /api/share - Upload file for QR sharing (auto-deleted in 5 min, QR valid for 1 min)
  if (req.method === "POST") {
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const buffer = Buffer.concat(chunks);
      if (!buffer.length) {
        return res.status(400).json({ ok: false, error: "Empty upload payload" });
      }

      const id = Math.random().toString(36).substring(2, 10);
      const nameHeader = req.headers["x-file-name"];
      const name = typeof nameHeader === "string" ? decodeURIComponent(nameHeader) : "download";
      const isPdf = name.toLowerCase().endsWith(".pdf");
      const type = isPdf ? "application/pdf" : (req.headers["content-type"] || "application/octet-stream");

      fileStore.set(id, { name, type, buffer, created: Date.now() });

      const downloadUrl = `${baseUrl}/download?id=${id}`;
      const directFileUrl = `${baseUrl}/api/share/file/${id}`;

      return res.status(200).json({
        ok: true,
        id,
        downloadUrl,
        directFileUrl,
        name,
        type,
        size: buffer.length,
        qrExpiresIn: 60, // QR code valid for 1 minute
        fileExpiresIn: 300 // Data automatically deleted in 5 minutes
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message || "Upload failed" });
    }
  }

  // GET /api/share/file/:id - Direct download or inline view
  if (req.method === "GET" && pathname.includes("/file/")) {
    const id = pathname.split("/").pop() || "";
    const item = fileStore.get(id);
    if (item && Date.now() - item.created <= FILE_TTL_MS) {
      const isPdf = item.name.toLowerCase().endsWith(".pdf") || (item.type && item.type.includes("pdf"));
      const contentType = isPdf ? "application/pdf" : (item.type || "application/octet-stream");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", item.buffer.length);

      const isView = url.searchParams.get("view") === "1";
      const disposition = isView ? "inline" : "attachment";
      const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(item.name)}`
      );
      return res.status(200).end(item.buffer);
    }
    if (item) fileStore.delete(id);
    return res.status(404).send("File expired or automatically deleted after 5 minutes");
  }

  // GET /api/share/info/:id - Metadata
  if (req.method === "GET" && pathname.includes("/info/")) {
    const id = pathname.split("/").pop() || "";
    const item = fileStore.get(id);
    if (item && Date.now() - item.created <= FILE_TTL_MS) {
      const isPdf = item.name.toLowerCase().endsWith(".pdf") || (item.type && item.type.includes("pdf"));
      const remainingSeconds = Math.max(0, Math.ceil((FILE_TTL_MS - (Date.now() - item.created)) / 1000));
      return res.status(200).json({
        ok: true,
        name: item.name,
        size: item.buffer.length,
        type: isPdf ? "application/pdf" : item.type,
        remainingSeconds
      });
    }
    if (item) fileStore.delete(id);
    return res.status(404).json({ ok: false, error: "File expired or automatically deleted after 5 minutes" });
  }

  // Default health check response
  return res.status(200).json({
    ok: true,
    service: "ImagePro Studio Cloud Transfer API",
    status: "online",
    time: new Date().toISOString()
  });
}
