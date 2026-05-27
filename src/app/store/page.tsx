"use client";
import { useEffect, useState } from "react";
import { Search, ShoppingCart, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart";

export default function StorePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d); setLoading(false); });
  }, [search]);

  function handleAdd(product: any) {
    addItem({ productId: product.id, name: product.name, price: product.price, sku: product.sku });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shop Products</h1>
        <p className="text-gray-500 mt-1">Browse our inventory</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-56 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="hover:shadow-lg transition-shadow group">
              <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-lg flex items-center justify-center">
                <Package className="h-16 w-16 text-blue-300" />
              </div>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{p.sku}</p>
                </div>
                {p.description && <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-700">{formatCurrency(p.price)}</span>
                  <Badge variant={p.quantity === 0 ? "danger" : p.quantity < 10 ? "warning" : "success"}>
                    {p.quantity === 0 ? "Out of stock" : `${p.quantity} left`}
                  </Badge>
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={p.quantity === 0}
                  variant={added === p.id ? "success" : "default"}
                  onClick={() => handleAdd(p)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {added === p.id ? "Added!" : p.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
