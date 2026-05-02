"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";

export function AddToCartButton({
  productId,
  label = "Ajouter au panier",
  quantity = 1,
}: {
  productId: string;
  label?: string;
  quantity?: number;
}) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      className="btn-primary inline-flex items-center gap-2"
      onClick={() => addItem(productId, quantity)}
    >
      <ShoppingBag className="h-4 w-4" />
      {label}
    </button>
  );
}
