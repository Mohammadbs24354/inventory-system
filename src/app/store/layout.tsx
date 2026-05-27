"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Package, ShoppingCart, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

function StoreNav() {
  const { data: session } = useSession();
  const { items } = useCart();
  const isStaff = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"].includes(session?.user?.role || "");

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/store" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <Package className="h-6 w-6 text-blue-600" />
            InvenTrack Store
          </Link>

          <nav className="flex items-center gap-2">
            {isStaff && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/store/orders">
                <User className="h-4 w-4" /> My Orders
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/store/cart" className="relative">
                <ShoppingCart className="h-4 w-4" />
                Cart
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </Link>
            </Button>
            {session ? (
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <StoreNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
