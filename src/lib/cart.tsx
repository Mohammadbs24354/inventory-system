"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [], addItem: () => {}, removeItem: () => {}, updateQty: () => {}, clear: () => {}, total: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  function addItem(item: Omit<CartItem, "quantity">) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) return prev.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQty(productId: string, quantity: number) {
    if (quantity <= 0) { removeItem(productId); return; }
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity } : i));
  }

  function clear() { setItems([]); }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total }}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
