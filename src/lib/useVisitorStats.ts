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
const DEFAULT_TOTAL = 38450;
const DEFAULT_TODAY = 1280;
const DEFAULT_ACTIVE = 22;

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
          return {
            total: Math.max(DEFAULT_TOTAL, parsed.total || DEFAULT_TOTAL),
            today: parsed.today || DEFAULT_TODAY,
            activeNow: parsed.activeNow || DEFAULT_ACTIVE,
            loading: false
          };
        }
      } catch {
        // use default
      }
    }
    return {
      total: DEFAULT_TOTAL,
      today: DEFAULT_TODAY,
      activeNow: DEFAULT_ACTIVE,
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
          today: data.today,
          activeNow: data.activeNow || DEFAULT_ACTIVE,
          loading: false
        };
        setStats(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return;
      }
    } catch {
      // Fallback: Increment local count if not peek
      setStats((prev) => {
        const updated = {
          total: isPeek ? prev.total : prev.total + 1,
          today: isPeek ? prev.today : prev.today + 1,
          activeNow: prev.activeNow,
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
