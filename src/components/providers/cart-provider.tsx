"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { CartItem } from "@/types/catalog";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "era-beauty-cart";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (rawValue) {
      try {
        // Hydrate cart state from browser storage after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(rawValue) as CartItem[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const addItem = (productId: string, quantity = 1) => {
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.productId === productId);

      if (!existing) {
        return [...currentItems, { productId, quantity }];
      }

      return currentItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    });
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart doit être utilisé dans CartProvider.");
  }

  return context;
};
