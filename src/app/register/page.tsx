"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/login");
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
            <p className="text-gray-500 text-sm">Create a customer account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(["name", "email", "password"] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                <Input
                  id={field}
                  type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required
                />
              </div>
            ))}

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
