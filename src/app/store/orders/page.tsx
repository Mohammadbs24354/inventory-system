"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

const statusBadge: Record<string, any> = { PENDING: "warning", PAID: "success", SHIPPED: "info", CANCELLED: "danger" };
const statusLabel: Record<string, string> = {
  PENDING: "Order placed — awaiting payment",
  PAID: "Payment confirmed — preparing shipment",
  SHIPPED: "Shipped — on the way!",
  CANCELLED: "Order cancelled",
};

export default function MyOrdersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch("/api/orders").then((r) => r.json()).then((d) => { setOrders(d); setLoading(false); });
    }
  }, [status]);

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded" />)}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button variant="outline" asChild><Link href="/store">Continue Shopping</Link></Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500">No orders yet</p>
          <Button className="mt-4" asChild><Link href="/store">Shop Now</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-0">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded === order.id ? "rotate-180" : ""}`} />
                    <div>
                      <p className="text-sm font-medium">{order.orderItems?.length} item(s)</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(order.totalPrice)}</span>
                    <Badge variant={statusBadge[order.status]}>{order.status}</Badge>
                  </div>
                </div>

                {expanded === order.id && (
                  <div className="border-t bg-gray-50 px-4 pb-4 pt-3 space-y-3">
                    <p className="text-xs text-gray-600">{statusLabel[order.status]}</p>
                    <div className="space-y-2">
                      {order.orderItems?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.product?.name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
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
