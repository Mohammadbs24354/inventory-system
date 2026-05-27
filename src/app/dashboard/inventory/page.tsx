"use client";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, RefreshCw, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const typeIcons = { IN: <ArrowUp className="h-4 w-4 text-green-600" />, OUT: <ArrowDown className="h-4 w-4 text-red-600" />, ADJUST: <RefreshCw className="h-4 w-4 text-blue-600" /> };
const typeBadge = { IN: "success" as const, OUT: "danger" as const, ADJUST: "info" as const };

export default function InventoryPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skuCheckResult, setSkuCheckResult] = useState<any>(null);
  const [needsCreate, setNeedsCreate] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    sku: "", quantity: "", type: "IN", reason: "",
    name: "", price: "", warehouseId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory/movements").then((r) => r.json()),
      fetch("/api/warehouses").then((r) => r.json()),
    ]).then(([m, w]) => { setMovements(m); setWarehouses(w); setLoading(false); });
  }, []);

  async function checkSku() {
    if (!form.sku) return;
    const res = await fetch(`/api/products?search=${encodeURIComponent(form.sku)}`);
    const products = await res.json();
    const found = products.find((p: any) => p.sku === form.sku);
    setSkuCheckResult(found || null);
    setNeedsCreate(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      if (data.action === "create_required") {
        setNeedsCreate(true);
        setError("Product not found. Fill in the details below to create it.");
      } else {
        setError(data.error);
      }
      return;
    }

    setSuccess(`Stock updated: ${data.product.name} — now ${data.product.quantity} units`);
    setForm({ sku: "", quantity: "", type: "IN", reason: "", name: "", price: "", warehouseId: "" });
    setSkuCheckResult(null);
    setNeedsCreate(false);

    // Refresh movements
    const mRes = await fetch("/api/inventory/movements");
    setMovements(await mRes.json());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* SKU Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Update Stock via SKU</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
              {success && <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{success}</div>}

              <div className="space-y-1">
                <Label>SKU</Label>
                <div className="flex gap-2">
                  <Input value={form.sku} onChange={(e) => { setForm({ ...form, sku: e.target.value }); setSkuCheckResult(null); setNeedsCreate(false); }} placeholder="DELL-123" />
                  <Button type="button" variant="outline" onClick={checkSku} disabled={!form.sku}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {skuCheckResult && (
                <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
                  Found: <strong>{skuCheckResult.name}</strong> — Current stock: <strong>{skuCheckResult.quantity}</strong>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Movement Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Stock In</SelectItem>
                      <SelectItem value="OUT">Stock Out</SelectItem>
                      <SelectItem value="ADJUST">Adjust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Reason</Label>
                <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Restock, sale, correction..." />
              </div>

              {needsCreate && (
                <div className="border border-dashed border-orange-300 rounded-md p-3 space-y-3 bg-orange-50">
                  <p className="text-sm font-medium text-orange-800">New product details</p>
                  <div className="space-y-1">
                    <Label>Product Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product Name" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Price ($)</Label>
                      <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Warehouse</Label>
                      <Select value={form.warehouseId} onValueChange={(v) => setForm({ ...form, warehouseId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Processing..." : "Update Stock"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent movements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : movements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No movements recorded</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 shrink-0">
                      {typeIcons[m.type as keyof typeof typeIcons]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.product.name}</p>
                      <p className="text-xs text-gray-500">{m.reason} · {m.createdBy.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={typeBadge[m.type as keyof typeof typeBadge]}>{m.type} {m.quantity}</Badge>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
