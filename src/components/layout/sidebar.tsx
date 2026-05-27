"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Package, Warehouse, ArrowUpDown, ShoppingCart,
  Users, LogOut, Menu, X, Store, BarChart2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/products", label: "Products", icon: Package, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/inventory", label: "Inventory", icon: ArrowUpDown, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/warehouses", label: "Warehouses", icon: Warehouse, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/users", label: "Users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = session?.user?.role || "";

  const visible = navItems.filter((item) => item.roles.includes(role));

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-800">
        <Package className="h-6 w-6 text-blue-400" />
        <span className="font-bold text-white text-lg">InvenTrack</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <Link
          href="/store"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <Store className="h-4 w-4" />
          Storefront
        </Link>
      </nav>

      <div className="border-t border-gray-800 px-3 py-4">
        <div className="mb-2 px-3">
          <p className="text-xs font-semibold text-gray-400">{session?.user?.name}</p>
          <p className="text-xs text-gray-500">{role.replace("_", " ")}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col bg-gray-900 min-h-screen fixed left-0 top-0">
        <NavContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 rounded-md bg-gray-900 p-2 text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 z-50 w-60 bg-gray-900 min-h-screen">
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
}
