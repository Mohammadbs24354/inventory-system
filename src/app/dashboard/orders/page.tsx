"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusBadge: Record<string, any> = { PENDING: "warning", PAID: "success", SHIPPED: "info", CANCELLED: "danger" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/orders");
    setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
    else { const d = await res.json(); alert(d.error); }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="text-sm text-gray-500">{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded === order.id ? "rotate-180" : ""}`} />
                    <div>
                      <p className="text-sm font-medium">{order.customer?.name || "Customer"}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)} · {order.orderItems?.length} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{formatCurrency(order.totalPrice)}</span>
                    <Badge variant={statusBadge[order.status]}>{order.status}</Badge>
                  </div>
                </div>

                {expanded === order.id && (
                  <div className="border-t px-4 pb-4 pt-3 bg-gray-50">
                    <div className="space-y-2 mb-4">
                      {order.orderItems?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.product?.name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Update status:</span>
                      <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["PENDING", "PAID", "SHIPPED", "CANCELLED"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
