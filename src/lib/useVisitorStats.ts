import { useEffect, useState } from "react";

export interface VisitorStats {
  total: number;
  today: number;
  activeNow: number;
  loading: boolean;
  formattedTotal: string;
  formattedToday: string;
  compactTotal: string;
  refresh: () => void;
}

const STORAGE_KEY = "imagepro_visitor_stats";
const SESSION_KEY = "imagepro_session_active";

function formatCompact(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toLocaleString();
}

export function useVisitorStats(): VisitorStats {
  const [stats, setStats] = useState<{ total: number; today: number; activeNow: number; loading: boolean }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Purge legacy inflated static numbers (e.g. 38450)
          if (parsed && typeof parsed.total === "number" && parsed.total < 30000) {
            return {
              total: parsed.total,
              today: typeof parsed.today === "number" ? parsed.today : 1,
              activeNow: typeof parsed.activeNow === "number" ? parsed.activeNow : 1,
              loading: false
            };
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // use fallback
      }
    }
    return {
      total: 1,
      today: 1,
      activeNow: 1,
      loading: true
    };
  });

  const fetchStats = async (isPeek: boolean) => {
    try {
      let sid = "";
      if (typeof window !== "undefined") {
        sid = localStorage.getItem("imagepro_client_id") || "";
        if (!sid) {
          sid = Math.random().toString(36).substring(2, 12);
          localStorage.setItem("imagepro_client_id", sid);
        }
      }

      const query = isPeek ? `?peek=1&sid=${sid}` : `?sid=${sid}`;
      const res = await fetch(`/api/stats/visitors${query}`);
      if (!res.ok) throw new Error("Stats endpoint unavailable");
      const data = await res.json();

      if (data.ok && typeof data.total === "number") {
        const updated = {
          total: data.total,
          today: typeof data.today === "number" ? data.today : 1,
          activeNow: typeof data.activeNow === "number" ? data.activeNow : 1,
          loading: false
        };
        setStats(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return;
      }
    } catch {
      // Fallback: Increment local count if not peek
      setStats((prev) => {
        const updated = {
          total: isPeek ? prev.total : prev.total + 1,
          today: isPeek ? prev.today : prev.today + 1,
          activeNow: Math.max(1, prev.activeNow),
          loading: false
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user already counted in current tab session
    const hasVisited = sessionStorage.getItem(SESSION_KEY);
    if (!hasVisited) {
      sessionStorage.setItem(SESSION_KEY, "1");
      fetchStats(false);
    } else {
      fetchStats(true);
    }

    // Refresh active presence every 60 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    total: stats.total,
    today: stats.today,
    activeNow: stats.activeNow,
    loading: stats.loading,
    formattedTotal: stats.total.toLocaleString(),
    formattedToday: stats.today.toLocaleString(),
    compactTotal: formatCompact(stats.total),
    refresh: () => fetchStats(true)
  };
}
