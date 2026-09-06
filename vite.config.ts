import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import os from "os";
import fs from "fs";
import path from "path";

function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

function mobileSharePlugin(): Plugin {
  const fileStore = new Map<
    string,
    { name: string; type: string; buffer: Buffer; created: number }
  >();
  const activeSessions = new Map<string, number>();
  const statsFilePath = path.resolve(process.cwd(), "visitor-stats.json");

  const getStats = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let s = { total: 1, today: 1, lastDay: todayStr };
    try {
      if (fs.existsSync(statsFilePath)) {
        const raw = fs.readFileSync(statsFilePath, "utf-8");
        const p = JSON.parse(raw);
        s.total = typeof p.total === "number" ? p.total : 1;
        s.today = typeof p.today === "number" ? p.today : 1;
        s.lastDay = p.lastDay || todayStr;
      }
    } catch {
      // fallback
    }
    if (s.lastDay !== todayStr) {
      s.today = 0;
      s.lastDay = todayStr;
    }
    return s;
  };

  const saveStats = (s: { total: number; today: number; lastDay: string }) => {
    try {
      fs.writeFileSync(statsFilePath, JSON.stringify(s, null, 2), "utf-8");
    } catch {
      // fallback
    }
  };

  // Periodically purge files older than 1 hour (unref'd so it doesn't hold open CI/build processes)
  const purgeTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, item] of fileStore.entries()) {
      if (now - item.created > 3600000) {
        fileStore.delete(id);
      }
    }
  }, 60000);
  if (typeof purgeTimer.unref === "function") {
    purgeTimer.unref();
  }

  const handleMiddleware = (req: any, res: any, next: any) => {
    const hostHeader = req.headers.host || "localhost:7000";
    const port = hostHeader.split(":")[1] || "7000";
    const localIp = getLocalIp();
    const url = new URL(req.url || "", `http://${hostHeader}`);

    // GET /api/stats/visitors - Real-time visitor counter (exact true count)
    if (req.method === "GET" && url.pathname === "/api/stats/visitors") {
      const isPeek = url.searchParams.get("peek") === "1";
      const sid = url.searchParams.get("sid") || req.socket?.remoteAddress || "client";
      const now = Date.now();

      activeSessions.set(sid, now);
      for (const [s, ts] of activeSessions.entries()) {
        if (now - ts > 180000) {
          activeSessions.delete(s);
        }
      }

      const s = getStats();
      if (!isPeek) {
        s.total += 1;
        s.today += 1;
        saveStats(s);
      }

      const activeNow = Math.max(1, activeSessions.size);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(JSON.stringify({
        ok: true,
        total: s.total,
        today: s.today,
        activeNow,
        timestamp: now
      }));
      return;
    }

    // GET /api/share/network-info
    if (req.method === "GET" && url.pathname === "/api/share/network-info") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(JSON.stringify({ ip: localIp, port }));
      return;
    }

    // POST /api/share - Upload file for QR sharing
    if (req.method === "POST" && url.pathname === "/api/share") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const id = Math.random().toString(36).substring(2, 10);
        const nameHeader = req.headers["x-file-name"];
        const name = typeof nameHeader === "string" ? decodeURIComponent(nameHeader) : "download";
        const type = (req.headers["content-type"] as string) || "application/octet-stream";
        fileStore.set(id, { name, type, buffer, created: Date.now() });

        const downloadUrl = `http://${localIp}:${port}/download?id=${id}`;
        const directFileUrl = `http://${localIp}:${port}/api/share/file/${id}`;

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(JSON.stringify({ ok: true, id, downloadUrl, directFileUrl, name, size: buffer.length }));
      });
      return;
    }

    // GET /api/share/file/:id - Direct download
    if (req.method === "GET" && url.pathname.startsWith("/api/share/file/")) {
      const id = url.pathname.split("/").pop() || "";
      const item = fileStore.get(id);
      if (item) {
        res.setHeader("Content-Type", item.type);
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(item.name)}"`);
        res.setHeader("Content-Length", item.buffer.length);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(item.buffer);
        return;
      }
      res.statusCode = 404;
      res.end("File expired or not found");
      return;
    }

    // GET /api/share/info/:id - Metadata
    if (req.method === "GET" && url.pathname.startsWith("/api/share/info/")) {
      const id = url.pathname.split("/").pop() || "";
      const item = fileStore.get(id);
      if (item) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(JSON.stringify({ ok: true, name: item.name, size: item.buffer.length, type: item.type }));
        return;
      }
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(JSON.stringify({ ok: false, error: "File expired or not found" }));
      return;
    }

    next();
  };

  return {
    name: "vite-plugin-imagepro-share",
    configureServer(server) {
      server.middlewares.use(handleMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleMiddleware);
    }
  };
}

export default defineConfig({
  plugins: [react(), mobileSharePlugin()],
  server: {
    host: "localhost"
  },
  preview: {
    host: "localhost"
  },
  resolve: {
    alias: {
      "@vercel/speed-insights/next": "@vercel/speed-insights/react"
    }
  },
  optimizeDeps: {
    exclude: ["pdfjs-dist"]
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 3500,
    reportCompressedSize: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-pdf-lib": ["pdf-lib"],
          "vendor-pdfjs": ["pdfjs-dist"],
          "vendor-motion": ["framer-motion"],
          "vendor-jszip": ["jszip"],
          "vendor-icons": ["lucide-react"]
        }
      }
    }
  }
});
