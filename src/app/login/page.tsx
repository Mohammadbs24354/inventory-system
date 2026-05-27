"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">InvenTrack</span>
            </div>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 border-t pt-4">
            <p className="text-center text-sm text-gray-500 mb-3">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="bg-gray-50 rounded p-2">
                <p className="font-semibold">Super Admin</p>
                <p>superadmin@inventory.com</p>
                <p>superadmin123</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="font-semibold">Admin</p>
                <p>admin@inventory.com</p>
                <p>admin123</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="font-semibold">Employee</p>
                <p>employee@inventory.com</p>
                <p>employee123</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="font-semibold">Customer</p>
                <p>customer@inventory.com</p>
                <p>customer123</p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            No account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
