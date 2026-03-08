"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const getSessionId = () => {
  const existing = window.sessionStorage.getItem("josy-cosmetics-session-id");
  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  window.sessionStorage.setItem("josy-cosmetics-session-id", nextId);
  return nextId;
};

export function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const dayKey = new Date().toISOString().slice(0, 10);
    const key = `josy-cosmetics-page-visit:${dayKey}:${pathname}`;

    if (window.sessionStorage.getItem(key)) {
      return;
    }

    window.sessionStorage.setItem(key, "1");

    void fetch("/api/analytics/page-visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pathname,
        sessionId: getSessionId(),
      }),
    });
  }, [pathname]);

  return null;
}
