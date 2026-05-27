"use client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Warehouse, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/warehouses");
    setWarehouses(await res.json());
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditItem(null);
    setForm({ name: "", location: "" });
    setError("");
    setOpen(true);
  }

  function openEdit(w: any) {
    setEditItem(w);
    setForm({ name: w.name, location: w.location });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const url = editItem ? `/api/warehouses/${editItem.id}` : "/api/warehouses";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this warehouse?")) return;
    const res = await fetch(`/api/warehouses/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Warehouses</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Warehouse</Button>
      </div>

      {warehouses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Warehouse className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No warehouses yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w) => (
            <Card key={w.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-blue-600" />
                    {w.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(w)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(w.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{w.location}</p>
                <p className="text-sm mt-2 font-medium">{w._count?.products || 0} products</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main Warehouse" />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Building A, Floor 1" />
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
