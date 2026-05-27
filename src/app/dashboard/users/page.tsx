"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

const roleBadge: Record<string, any> = { SUPER_ADMIN: "danger", ADMIN: "info", EMPLOYEE: "success", CUSTOMER: "default" };
const roleLabel: Record<string, string> = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", EMPLOYEE: "Employee", CUSTOMER: "Customer" };

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" });

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  async function load() {
    const res = await fetch("/api/users");
    setUsers(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => { setForm({ name: "", email: "", password: "", role: "EMPLOYEE" }); setError(""); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                    {user.role === "SUPER_ADMIN" ? (
                      <Shield className="h-4 w-4 text-red-600" />
                    ) : (
                      <Users className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {user.name}
                      <Badge variant={roleBadge[user.role]}>{roleLabel[user.role]}</Badge>
                    </p>
                    <p className="text-xs text-gray-500">{user.email} · Joined {formatDate(user.createdAt)}</p>
                  </div>
                </div>
                {user.role !== "SUPER_ADMIN" && user.id !== session?.user?.id && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={saving} className="flex-1">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Creating..." : "Create User"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
