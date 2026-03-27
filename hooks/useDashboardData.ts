import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "next-auth";

interface DashboardData {
  totalCategories: number;
  totalItems: number;
  totalUsers: number;
  ordersStats: {
    running: { count: number; amount: number };
    completed: { count: number; amount: number };
    cancelled: { count: number; amount: number };
  };
  totalPurchaseCount: number;
  totalPurchaseAmount: number;
  restaurants: Array<{
    name: string;
    openingTime: string;
    closingTime: string;
    operatingDays: string[];
    shopStatus: string;
  }>;
}

const CACHE_KEY = "dashboard_cache";
const CACHE_DURATION = 5 * 60 * 1000;

const getCache = (key: string): DashboardData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp, cacheKey } = JSON.parse(cached);
    return Date.now() - timestamp < CACHE_DURATION && cacheKey === key ? data : null;
  } catch {
    return null;
  }
};

const setCache = (key: string, data: DashboardData) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now(), cacheKey: key }));
  } catch {}
};

export function useDashboardData(session: Session | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("daily");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!session) return;

    const cacheKey = `${period}-${dateRange.start}-${dateRange.end}`;
    if (!force) {
      const cached = getCache(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    
    // Create new AbortController
    abortRef.current = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (period === "custom" && dateRange.start && dateRange.end) {
      params.set("start", dateRange.start);
      params.set("end", dateRange.end);
    } else {
      params.set("period", period);
    }

    try {
      const res = await fetch(`/api/dashboard?${params}`, { 
        signal: abortRef.current.signal 
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setCache(cacheKey, json);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Fetch failed:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [session, period, dateRange]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    period,
    setPeriod,
    dateRange,
    setDateRange,
    fetchData,
  };
}