"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useSession } from "next-auth/react";

export default function CartPage() {
  const { items, removeItem, updateQty, clear, total } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!session) { router.push("/login"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "Checkout failed"); return; }

    clear();
    router.push("/store/orders");
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <ShoppingCart className="h-20 w-20 mx-auto mb-4 text-gray-200" />
        <h2 className="text-2xl font-semibold text-gray-600">Your cart is empty</h2>
        <p className="text-gray-400 mt-2">Browse products and add them to your cart</p>
        <Button className="mt-6" asChild><Link href="/store">Browse Products</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Shopping Cart</h1>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.productId}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-400">{item.sku}</p>
                <p className="text-sm text-blue-700 font-semibold mt-1">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, item.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="w-20 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeItem(item.productId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-700">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" asChild className="flex-1">
          <Link href="/store">Continue Shopping</Link>
        </Button>
        <Button className="flex-1" onClick={handleCheckout} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Processing..." : session ? "Place Order" : "Sign In to Checkout"}
        </Button>
      </div>
    </div>
  );
}
