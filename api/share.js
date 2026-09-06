// Vercel Serverless Function for ImagePro Studio mobile sharing & QR download transfer
const fileStore = new Map();

// Auto-purge items older than 30 minutes
function purgeExpired() {
  const now = Date.now();
  for (const [id, item] of fileStore.entries()) {
    if (now - item.created > 1800000) {
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

  // POST /api/share - Upload file for QR sharing
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
      const type = req.headers["content-type"] || "application/octet-stream";

      fileStore.set(id, { name, type, buffer, created: Date.now() });

      const downloadUrl = `${baseUrl}/download?id=${id}`;
      const directFileUrl = `${baseUrl}/api/share/file/${id}`;

      return res.status(200).json({
        ok: true,
        id,
        downloadUrl,
        directFileUrl,
        name,
        size: buffer.length
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message || "Upload failed" });
    }
  }

  // GET /api/share/file/:id - Direct download
  if (req.method === "GET" && pathname.includes("/file/")) {
    const id = pathname.split("/").pop() || "";
    const item = fileStore.get(id);
    if (item) {
      res.setHeader("Content-Type", item.type);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(item.name)}"`);
      res.setHeader("Content-Length", item.buffer.length);
      return res.status(200).end(item.buffer);
    }
    return res.status(404).send("File expired or not found");
  }

  // GET /api/share/info/:id - Metadata
  if (req.method === "GET" && pathname.includes("/info/")) {
    const id = pathname.split("/").pop() || "";
    const item = fileStore.get(id);
    if (item) {
      return res.status(200).json({
        ok: true,
        name: item.name,
        size: item.buffer.length,
        type: item.type
      });
    }
    return res.status(404).json({ ok: false, error: "File expired or not found" });
  }

  // Default health check response
  return res.status(200).json({
    ok: true,
    service: "ImagePro Studio Cloud Transfer API",
    status: "online",
    time: new Date().toISOString()
  });
}
