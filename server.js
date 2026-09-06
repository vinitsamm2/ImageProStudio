import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "10000", 10);
const host = "0.0.0.0"; // Explicitly bind to 0.0.0.0 for Render, Railway, Docker, and Cloud platforms

// --- Visitor Statistics Tracker ---
const statsFilePath = path.join(__dirname, "visitor-stats.json");
const activeSessions = new Map();

let visitorStats = {
  total: 1,
  today: 1,
  lastDay: new Date().toISOString().slice(0, 10)
};

try {
  if (fs.existsSync(statsFilePath)) {
    const raw = fs.readFileSync(statsFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    visitorStats.total = typeof parsed.total === "number" ? parsed.total : 1;
    visitorStats.today = typeof parsed.today === "number" ? parsed.today : 1;
    visitorStats.lastDay = parsed.lastDay || new Date().toISOString().slice(0, 10);
  }
} catch {
  // fallback to in-memory defaults
}

const saveStats = () => {
  try {
    fs.writeFileSync(statsFilePath, JSON.stringify({
      total: visitorStats.total,
      today: visitorStats.today,
      lastDay: visitorStats.lastDay
    }, null, 2), "utf-8");
  } catch {
    // ignore
  }
};

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

// GET /api/stats/visitors - Real-time visitor counter (exact true count)
app.get("/api/stats/visitors", (req, res) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (visitorStats.lastDay !== todayStr) {
    visitorStats.today = 0;
    visitorStats.lastDay = todayStr;
  }

  const isPeek = req.query.peek === "1";
  const sid = req.query.sid || req.ip || Math.random().toString(36).slice(2);
  const now = Date.now();

  // Track active sessions in 3-minute rolling window
  activeSessions.set(sid, now);
  for (const [s, ts] of activeSessions.entries()) {
    if (now - ts > 180000) {
      activeSessions.delete(s);
    }
  }

  if (!isPeek) {
    visitorStats.total += 1;
    visitorStats.today += 1;
    saveStats();
  }

  // Real active users online count
  const activeNow = Math.max(1, activeSessions.size);

  res.json({
    ok: true,
    total: visitorStats.total,
    today: visitorStats.today,
    activeNow,
    timestamp: now
  });
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
    const isPdf = name.toLowerCase().endsWith(".pdf");
    const type = isPdf ? "application/pdf" : ((req.headers["content-type"]) || "application/octet-stream");

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
      type,
      size: buffer.length
    });
  });
});

// GET /api/share/file/:id - Direct download or inline view
app.get("/api/share/file/:id", (req, res) => {
  const id = req.params.id;
  const item = fileStore.get(id);
  if (item) {
    const isPdf = item.name.toLowerCase().endsWith(".pdf") || (item.type && item.type.includes("pdf"));
    const contentType = isPdf ? "application/pdf" : (item.type || "application/octet-stream");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", item.buffer.length);

    // Support ?view=1 for native mobile browser PDF viewer
    const dispositionType = req.query.view === "1" ? "inline" : "attachment";
    const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(item.name)}`
    );
    return res.end(item.buffer);
  }
  res.status(404).send("File expired or not found");
});

// GET /api/share/info/:id - Metadata
app.get("/api/share/info/:id", (req, res) => {
  const id = req.params.id;
  const item = fileStore.get(id);
  if (item) {
    const isPdf = item.name.toLowerCase().endsWith(".pdf") || (item.type && item.type.includes("pdf"));
    return res.json({
      ok: true,
      name: item.name,
      size: item.buffer.length,
      type: isPdf ? "application/pdf" : item.type
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
