"use client";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from "recharts";
import * as Tabs from "@radix-ui/react-tabs";
import {
  TrendingUp, Award, ShoppingBag, FileDown, RefreshCw, Link2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Period = "7d" | "30d" | "12m" | "custom";

interface SalesProduct {
  id: string;
  name: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  rank: number;
}
interface SalesSummary { totalOrders: number; totalRevenue: number; from: string; to: string }
interface TrendPoint { label: string; orders: number; revenue: number }
interface TrendSummary { totalOrders: number; totalRevenue: number; from: string; to: string }
interface Association { count: number; percentage: string; products: { name: string; sku: string }[] }
interface AssocSummary { totalOrders: number; from: string; to: string }

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "12m": "Last 12 Months",
  custom: "Custom Range",
};

function buildQuery(period: Period, from: string, to: string) {
  const params = new URLSearchParams({ period });
  if (period === "custom") { params.set("from", from); params.set("to", to); }
  return params.toString();
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeTab, setActiveTab] = useState("best-sellers");

  const [salesProducts, setSalesProducts] = useState<SalesProduct[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [trendSummary, setTrendSummary] = useState<TrendSummary | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [assocSummary, setAssocSummary] = useState<AssocSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    setLoading(true);
    const q = buildQuery(period, customFrom, customTo);
    try {
      const [salesRes, trendsRes, assocRes] = await Promise.all([
        fetch(`/api/analytics/sales?${q}`),
        fetch(`/api/analytics/trends?${q}`),
        fetch(`/api/analytics/associations?${q}&minCount=2`),
      ]);
      const [salesData, trendsData, assocData] = await Promise.all([
        salesRes.json(), trendsRes.json(), assocRes.json(),
      ]);
      setSalesProducts(salesData.products || []);
      setSalesSummary(salesData.summary || null);
      setTrends(trendsData.trends || []);
      setTrendSummary(trendsData.summary || null);
      setAssociations(assocData.associations || []);
      setAssocSummary(assocData.summary || null);
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const periodLabel = PERIOD_LABELS[period];
      const generatedAt = new Date().toLocaleString("en-US");
      const fromLabel = salesSummary ? new Date(salesSummary.from).toLocaleDateString("en-US") : "";
      const toLabel = salesSummary ? new Date(salesSummary.to).toLocaleDateString("en-US") : "";

      // Header
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175);
      doc.text("InvenTrack – Analytics Report", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${periodLabel}  (${fromLabel} – ${toLabel})`, 14, 26);
      doc.text(`Generated: ${generatedAt}`, 14, 32);

      let y = 42;

      // Summary
      if (salesSummary) {
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("Summary", 14, y);
        y += 6;
        autoTable(doc, {
          startY: y,
          head: [["Total Orders", "Total Revenue"]],
          body: [[salesSummary.totalOrders.toString(), formatCurrency(salesSummary.totalRevenue)]],
          styles: { fontSize: 10 },
          headStyles: { fillColor: [30, 64, 175] },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Best Sellers
      if (salesProducts.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("Best-Selling Products", 14, y);
        y += 6;
        autoTable(doc, {
          startY: y,
          head: [["Rank", "Product", "SKU", "Qty Sold", "Revenue"]],
          body: salesProducts.slice(0, 20).map((p) => [
            p.rank,
            p.name,
            p.sku,
            p.totalQuantity.toLocaleString(),
            formatCurrency(p.totalRevenue),
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [30, 64, 175] },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Trends
      if (trends.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("Sales Trends", 14, y);
        y += 6;
        autoTable(doc, {
          startY: y,
          head: [["Period", "Orders", "Revenue"]],
          body: trends.map((t) => [t.label, t.orders, formatCurrency(t.revenue)]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [30, 64, 175] },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Associations
      if (associations.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("Product Associations (Frequently Bought Together)", 14, y);
        y += 6;
        autoTable(doc, {
          startY: y,
          head: [["Product A", "Product B", "Co-occurrences", "% of Orders"]],
          body: associations.map((a) => [
            a.products[0]?.name || "",
            a.products[1]?.name || "",
            a.count,
            `${a.percentage}%`,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [30, 64, 175] },
        });
      }

      doc.save(`analytics-report-${period}-${Date.now()}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const topChartData = salesProducts.slice(0, 10).map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name,
    qty: p.totalQuantity,
    revenue: parseFloat(p.totalRevenue.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sales performance, trends & product insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={exportPDF} disabled={exporting || loading}>
            <FileDown className="h-4 w-4 mr-1" />
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {(["7d", "30d", "12m", "custom"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              period === p
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        )}
      </div>

      {/* Summary KPIs */}
      {salesSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Orders Analyzed"
            value={salesSummary.totalOrders.toLocaleString()}
            sub={PERIOD_LABELS[period]}
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(salesSummary.totalRevenue)}
          />
          <StatCard
            label="Products Sold"
            value={salesProducts.length.toLocaleString()}
            sub="unique products"
          />
          <StatCard
            label="Top Product"
            value={salesProducts[0]?.name.slice(0, 20) || "—"}
            sub={salesProducts[0] ? `${salesProducts[0].totalQuantity} units` : ""}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-gray-200 gap-1">
          {[
            { value: "best-sellers", label: "Best Sellers", icon: Award },
            { value: "trends", label: "Sales Trends", icon: TrendingUp },
            { value: "associations", label: "Product Associations", icon: Link2 },
          ].map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === value
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Best Sellers */}
        <Tabs.Content value="best-sellers" className="pt-4 space-y-4">
          {loading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
          ) : salesProducts.length === 0 ? (
            <EmptyState message="No sales data for the selected period" />
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top 10 by Quantity Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v, name) =>
                          name === "qty" ? [(v as number) + " units", "Qty"] : [formatCurrency(v as number), "Revenue"]
                        }
                      />
                      <Bar dataKey="qty" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Full Rankings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto max-h-[340px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">#</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Qty</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesProducts.map((p) => (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-400 font-medium">{p.rank}</td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-gray-900 truncate max-w-[160px]">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.sku}</p>
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium">{p.totalQuantity.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right text-blue-700 font-medium">
                              {formatCurrency(p.totalRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Tabs.Content>

        {/* Sales Trends */}
        <Tabs.Content value="trends" className="pt-4 space-y-4">
          {loading ? (
            <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
          ) : trends.length === 0 ? (
            <EmptyState message="No trend data for the selected period" />
          ) : (
            <div className="grid lg:grid-cols-3 gap-4">
              {trendSummary && (
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Total Orders"
                    value={trendSummary.totalOrders.toLocaleString()}
                  />
                  <StatCard
                    label="Total Revenue"
                    value={formatCurrency(trendSummary.totalRevenue)}
                  />
                  <StatCard
                    label="Avg. Revenue / Period"
                    value={
                      trends.length > 0
                        ? formatCurrency(trendSummary.totalRevenue / trends.length)
                        : "—"
                    }
                  />
                </div>
              )}

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Orders Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trends} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fill="url(#colorOrders)"
                        name="Orders"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trends} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v) => [formatCurrency(v as number), "Revenue"]} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#16a34a"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trends table */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Period Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto max-h-60">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Period</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Orders</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trends.map((t) => (
                          <tr key={t.label} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-medium">{t.label}</td>
                            <td className="px-4 py-2.5 text-right">{t.orders}</td>
                            <td className="px-4 py-2.5 text-right text-green-700 font-medium">
                              {formatCurrency(t.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Tabs.Content>

        {/* Product Associations */}
        <Tabs.Content value="associations" className="pt-4 space-y-4">
          {loading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
          ) : associations.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-400">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No association patterns found</p>
                  <p className="text-xs mt-1">This requires orders with 2+ products. Try a longer period.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assocSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Orders Analyzed"
                    value={assocSummary.totalOrders.toLocaleString()}
                  />
                  <StatCard
                    label="Unique Pairs Found"
                    value={associations.length.toLocaleString()}
                    sub="min. 2 co-occurrences"
                  />
                </div>
              )}

              {/* Top associations bar chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Product Pairs by Co-occurrence</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.min(associations.slice(0, 10).length * 52 + 20, 340)}>
                    <BarChart
                      data={associations.slice(0, 10).map((a) => ({
                        pair: `${a.products[0]?.name.slice(0, 14)}… + ${a.products[1]?.name.slice(0, 14)}…`,
                        count: a.count,
                      }))}
                      layout="vertical"
                      margin={{ left: 8, right: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="pair" width={180} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [v as number, "Co-occurrences"]} />
                      <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Full table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">All Detected Pairs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product A</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product B</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Co-occurrences</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">% of Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associations.map((a, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-2.5">
                              <p className="font-medium truncate max-w-[160px]">{a.products[0]?.name}</p>
                              <p className="text-xs text-gray-400">{a.products[0]?.sku}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium truncate max-w-[160px]">{a.products[1]?.name}</p>
                              <p className="text-xs text-gray-400">{a.products[1]?.sku}</p>
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-purple-700">{a.count}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">{a.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
