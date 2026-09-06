// Vercel Serverless Function for ImagePro Studio visitor statistics & community metrics
let memoryTotal = 1;
let memoryToday = 1;
let lastDay = new Date().toISOString().slice(0, 10);
const activeIps = new Map();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const todayStr = new Date().toISOString().slice(0, 10);
  if (lastDay !== todayStr) {
    memoryToday = 0;
    lastDay = todayStr;
  }

  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const isPeek = url.searchParams.get("peek") === "1";
  const sid = url.searchParams.get("sid") || req.headers["x-forwarded-for"] || "anon";
  const now = Date.now();

  activeIps.set(sid, now);
  for (const [s, ts] of activeIps.entries()) {
    if (now - ts > 180000) {
      activeIps.delete(s);
    }
  }

  if (!isPeek) {
    memoryTotal += 1;
    memoryToday += 1;
  }

  const activeNow = Math.max(1, activeIps.size);

  return res.status(200).json({
    ok: true,
    total: memoryTotal,
    today: memoryToday,
    activeNow,
    timestamp: Date.now()
  });
}
