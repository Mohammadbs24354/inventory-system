"use client";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, SlidersHorizontal, Search, Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type MoveType = "IN" | "OUT" | "ADJUST";

const typeConfig = {
  IN:     { label: "Add Stock",    icon: <ArrowUp   className="h-4 w-4" />, color: "bg-green-600 hover:bg-green-700", preview: (cur: number, qty: number) => cur + qty },
  OUT:    { label: "Remove Stock", icon: <ArrowDown className="h-4 w-4" />, color: "bg-red-600   hover:bg-red-700",   preview: (cur: number, qty: number) => cur - qty },
  ADJUST: { label: "Set to exact", icon: <SlidersHorizontal className="h-4 w-4" />, color: "bg-blue-600  hover:bg-blue-700",  preview: (_cur: number, qty: number) => qty },
};

export default function InventoryPage() {
  const [products,  setProducts]  = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState<any>(null);
  const [moveType,  setMoveType]  = useState<MoveType>("IN");
  const [quantity,  setQuantity]  = useState("");
  const [reason,    setReason]    = useState("");
  const [success,   setSuccess]   = useState("");
  const [error,     setError]     = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/inventory/movements").then((r) => r.json()),
    ]).then(([p, m]) => { setProducts(p); setMovements(m); setLoading(false); });
  }, []);

  const filtered = search.length > 0
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const qty = Number(quantity) || 0;
  const newStock = selected ? typeConfig[moveType].preview(selected.quantity, qty) : 0;
  const stockInvalid = selected && qty > 0 && newStock < 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || qty <= 0) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku: selected.sku, quantity: qty, type: moveType, reason }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(data.error); return; }

    setSuccess(`Done! ${data.product.name} — stock is now ${data.product.quantity} units`);
    setSelected({ ...selected, quantity: data.product.quantity });
    setQuantity("");
    setReason("");

    // update local product list + movements
    setProducts((prev) => prev.map((p) => p.id === data.product.id ? { ...p, quantity: data.product.quantity } : p));
    const mRes = await fetch("/api/inventory/movements");
    setMovements(await mRes.json());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Left: product picker + form */}
        <div className="space-y-4">

          {/* Step 1 — Pick product */}
          <Card>
            <CardHeader><CardTitle className="text-base">1 · Select a Product</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Search by name or SKU…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelected(null); setSuccess(""); setError(""); }}
                />
              </div>

              {loading ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
              ) : search && filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No products found</p>
              ) : search ? (
                <ul className="divide-y rounded-md border max-h-48 overflow-y-auto">
                  {filtered.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => { setSelected(p); setSearch(""); setSuccess(""); setError(""); }}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${selected?.id === p.id ? "bg-blue-50" : ""}`}
                    >
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-gray-400 text-xs">{p.sku}</span>
                      </div>
                      <span className={`font-semibold ${p.quantity < 10 ? "text-red-600" : "text-gray-700"}`}>
                        {p.quantity} units
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {selected && (
                <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <PackageCheck className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-900">{selected.name}</p>
                    <p className="text-xs text-blue-600">SKU: {selected.sku} · Current stock: <strong>{selected.quantity}</strong></p>
                  </div>
                  <button onClick={() => { setSelected(null); setSuccess(""); setError(""); }} className="text-xs text-blue-500 hover:underline">Change</button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2 — Operation (only shown when product selected) */}
          {selected && (
            <Card>
              <CardHeader><CardTitle className="text-base">2 · Choose Operation</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error   && <div className="rounded-md bg-red-50   border border-red-200   px-3 py-2 text-sm text-red-700">{error}</div>}
                  {success && <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{success}</div>}

                  {/* Type selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {(["IN", "OUT", "ADJUST"] as MoveType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMoveType(t)}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 py-3 text-xs font-medium transition-all ${
                          moveType === t
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {typeConfig[t].icon}
                        {typeConfig[t].label}
                      </button>
                    ))}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                    />
                  </div>

                  {/* Live preview */}
                  {qty > 0 && (
                    <div className={`rounded-md border px-3 py-2 text-sm ${stockInvalid ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
                      {moveType === "IN"     && <span>{selected.quantity} + {qty} = <strong>{newStock}</strong> units</span>}
                      {moveType === "OUT"    && <span>{selected.quantity} − {qty} = <strong className={newStock < 0 ? "text-red-600" : ""}>{newStock}</strong> units</span>}
                      {moveType === "ADJUST" && <span>Set stock to <strong>{newStock}</strong> units</span>}
                      {stockInvalid && <span className="ml-2 font-medium">— not enough stock!</span>}
                    </div>
                  )}

                  {/* Reason */}
                  <div className="space-y-1">
                    <Label>Reason <span className="text-gray-400 font-normal">(optional)</span></Label>
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Restock, sale, damaged goods…"
                    />
                  </div>

                  <Button
                    type="submit"
                    className={`w-full text-white ${typeConfig[moveType].color}`}
                    disabled={submitting || qty <= 0 || !!stockInvalid}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Saving…" : `${typeConfig[moveType].label} (${qty || 0})`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: movement history */}
        <Card>
          <CardHeader><CardTitle>Movement History</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : movements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No movements recorded</p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${m.type === "IN" ? "bg-green-100" : m.type === "OUT" ? "bg-red-100" : "bg-blue-100"}`}>
                      {m.type === "IN"  ? <ArrowUp    className="h-4 w-4 text-green-600" /> :
                       m.type === "OUT" ? <ArrowDown  className="h-4 w-4 text-red-600"   /> :
                                          <SlidersHorizontal className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.product?.name}</p>
                      <p className="text-xs text-gray-500">{m.reason} · {m.createdBy?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={m.type === "IN" ? "success" : m.type === "OUT" ? "danger" : "info"}>
                        {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "="}{m.quantity}
                      </Badge>
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
