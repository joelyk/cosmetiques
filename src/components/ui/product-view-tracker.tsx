"use client";

import { useEffect } from "react";

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const key = `josy-cosmetics-product-view:${new Date().toISOString().slice(0, 10)}:${productId}`;

    if (window.sessionStorage.getItem(key)) {
      return;
    }

    window.sessionStorage.setItem(key, "1");

    void fetch("/api/analytics/product-click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });
  }, [productId]);

  return null;
}
