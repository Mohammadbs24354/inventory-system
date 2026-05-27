"use client";
import { useEffect, useState } from "react";
import { Package, TrendingUp, ShoppingCart, AlertTriangle, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  totalProducts: number;
  totalStock: number;
  totalOrders: number;
  activeOrders: number;
  recentMovements: any[];
  lowStockProducts: any[];
  ordersByStatus: any[];
  recentOrders: any[];
}

const movementIcon = { IN: <ArrowUp className="h-3 w-3 text-green-600" />, OUT: <ArrowDown className="h-3 w-3 text-red-600" />, ADJUST: <RefreshCw className="h-3 w-3 text-blue-600" /> };
const movementBadge = { IN: "success" as const, OUT: "danger" as const, ADJUST: "info" as const };
const orderBadge: Record<string, any> = { PENDING: "warning", PAID: "success", SHIPPED: "info", CANCELLED: "danger" };

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Total Products", value: data.totalProducts, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Stock", value: data.totalStock.toLocaleString(), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Orders", value: data.activeOrders, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your inventory system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`${bg} ${color} p-3 rounded-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Movements */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inventory Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentMovements.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No movements yet</p>
              ) : (
                <div className="space-y-3">
                  {data.recentMovements.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          {movementIcon[m.type as keyof typeof movementIcon]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.product.name}</p>
                          <p className="text-xs text-gray-500">{m.reason} · {m.createdBy.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={movementBadge[m.type as keyof typeof movementBadge]}>
                          {m.type} {m.quantity}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(m.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.lowStockProducts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">All products well stocked</p>
              ) : (
                <div className="space-y-3">
                  {data.lowStockProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.sku}</p>
                      </div>
                      <Badge variant={p.quantity === 0 ? "danger" : "warning"}>
                        {p.quantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {data.recentOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{o.customer.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(o.totalPrice)}</p>
                      </div>
                      <Badge variant={orderBadge[o.status]}>{o.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
