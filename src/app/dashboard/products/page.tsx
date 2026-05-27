"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function ProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", price: "", quantity: "", description: "", warehouseId: "" });
  const [error, setError] = useState("");

  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(session?.user?.role || "");

  async function loadData() {
    const [pRes, wRes] = await Promise.all([
      fetch(`/api/products?search=${encodeURIComponent(search)}`),
      fetch("/api/warehouses"),
    ]);
    setProducts(await pRes.json());
    setWarehouses(await wRes.json());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [search]);

  function openCreate() {
    setEditProduct(null);
    setForm({ name: "", sku: "", price: "", quantity: "", description: "", warehouseId: "" });
    setError("");
    setOpen(true);
  }

  function openEdit(p: any) {
    setEditProduct(p);
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity: String(p.quantity), description: p.description || "", warehouseId: p.warehouseId });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const url = editProduct ? `/api/products/${editProduct.id}` : "/api/products";
      const method = editProduct ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      setOpen(false);
      loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products total</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input placeholder="Search by name or SKU..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No products found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{p.sku}</Badge>
                  <span className="font-semibold text-blue-700">{formatCurrency(p.price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Stock</span>
                  <Badge variant={p.quantity === 0 ? "danger" : p.quantity < 10 ? "warning" : "success"}>
                    {p.quantity} units
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{p.warehouse?.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Product Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dell Laptop" />
              </div>
              <div className="space-y-1">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="DELL-123" disabled={!!editProduct} />
              </div>
              <div className="space-y-1">
                <Label>Price ($)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="999.99" />
              </div>
              {!editProduct && (
                <div className="space-y-1">
                  <Label>Initial Qty</Label>
                  <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                </div>
              )}
              <div className={`space-y-1 ${editProduct ? "col-span-2" : ""}`}>
                <Label>Warehouse</Label>
                <Select value={form.warehouseId} onValueChange={(v) => setForm({ ...form, warehouseId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Description (optional)</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
