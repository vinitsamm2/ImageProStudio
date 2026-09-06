import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "10000", 10);
const host = "0.0.0.0"; // Explicitly bind to 0.0.0.0 for Render, Railway, Docker, and Cloud platforms

// Ephemeral memory store for mobile QR sharing (auto-purged after 30 min)
const fileStore = new Map();
const purgeExpired = () => {
  const now = Date.now();
  for (const [id, item] of fileStore.entries()) {
    if (now - item.created > 1800000) {
      fileStore.delete(id);
    }
  }
};

const purgeTimer = setInterval(purgeExpired, 60000);
if (typeof purgeTimer.unref === "function") {
  purgeTimer.unref();
}

// CORS & Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-file-name, Range");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// GET /api/share/network-info
app.get("/api/share/network-info", (req, res) => {
  const hostHeader = req.headers.host || `localhost:${port}`;
  res.json({
    ip: hostHeader,
    port,
    isCloud: true
  });
});

// POST /api/share - Upload file for QR sharing
app.post("/api/share", (req, res) => {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const buffer = Buffer.concat(chunks);
    if (!buffer.length) {
      return res.status(400).json({ ok: false, error: "Empty upload payload" });
    }

    const id = Math.random().toString(36).substring(2, 10);
    const nameHeader = req.headers["x-file-name"];
    const name = typeof nameHeader === "string" ? decodeURIComponent(nameHeader) : "download";
    const type = (req.headers["content-type"]) || "application/octet-stream";

    fileStore.set(id, { name, type, buffer, created: Date.now() });

    const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${port}`;
    const baseUrl = `${proto}://${hostHeader}`;

    const downloadUrl = `${baseUrl}/download?id=${id}`;
    const directFileUrl = `${baseUrl}/api/share/file/${id}`;

    res.json({
      ok: true,
      id,
      downloadUrl,
      directFileUrl,
      name,
      size: buffer.length
    });
  });
});

// GET /api/share/file/:id - Direct download
app.get("/api/share/file/:id", (req, res) => {
  const id = req.params.id;
  const item = fileStore.get(id);
  if (item) {
    res.setHeader("Content-Type", item.type);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(item.name)}"`);
    res.setHeader("Content-Length", item.buffer.length);
    return res.end(item.buffer);
  }
  res.status(404).send("File expired or not found");
});

// GET /api/share/info/:id - Metadata
app.get("/api/share/info/:id", (req, res) => {
  const id = req.params.id;
  const item = fileStore.get(id);
  if (item) {
    return res.json({
      ok: true,
      name: item.name,
      size: item.buffer.length,
      type: item.type
    });
  }
  res.status(404).json({ ok: false, error: "File expired or not found" });
});

// Health check
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Serve compiled static assets from dist
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath, {
  maxAge: "1d",
  setHeaders: (res, filePath) => {
    if (filePath.includes("/assets/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  }
}));

// SPA Fallback: Any unknown routes serve index.html
app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Start listening immediately on 0.0.0.0
app.listen(port, host, () => {
  console.log(`[ImagePro Studio] Server running on http://${host}:${port}`);
  console.log(`[ImagePro Studio] Port ${port} exposed for Render / Cloud hosting`);
});
