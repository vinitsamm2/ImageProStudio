import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import os from "os";

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

  // Periodically purge files older than 1 hour
  setInterval(() => {
    const now = Date.now();
    for (const [id, item] of fileStore.entries()) {
      if (now - item.created > 3600000) {
        fileStore.delete(id);
      }
    }
  }, 60000);

  const handleMiddleware = (req: any, res: any, next: any) => {
    const hostHeader = req.headers.host || "localhost:7000";
    const port = hostHeader.split(":")[1] || "7000";
    const localIp = getLocalIp();
    const url = new URL(req.url || "", `http://${hostHeader}`);

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
    port: 7000,
    host: "0.0.0.0"
  },
  preview: {
    port: 7000,
    host: "0.0.0.0"
  },
  optimizeDeps: {
    exclude: ["pdfjs-dist"]
  },
  build: {
    target: "es2020"
  }
});
