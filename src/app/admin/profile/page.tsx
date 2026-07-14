"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";

export default function AdminProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session.user.role === "ADMIN") {
      fetch("/api/user/me")
        .then(res => res.json())
        .then(data => {
          setFormData({
            name: data.name || "",
          });
          setIsLoading(false);
        })
        .catch(() => {
          setError("Failed to load profile data");
          setIsLoading(false);
        });
    } else if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ name: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/admin/doctors" className="text-gray-500 hover:text-blue-600 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div className="text-xl font-bold text-gray-900 tracking-tight">
            My Profile
          </div>
        </div>
        <UserMenu user={{
          name: session?.user?.name ?? "User",
          email: session?.user?.email ?? "",
          role: (session?.user?.role as "ADMIN" | "DOCTOR" | "PATIENT") ?? "ADMIN",
        }} />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        {error && <Alert type="error" message={error} className="mb-6" />}
        {success && <Alert type="success" message={success} className="mb-6" />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Read-only sidebar */}
          <div className="space-y-6">
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-center">
              <div className="w-24 h-24 bg-blue-600 text-white text-3xl font-bold rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                {formData.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
              <p className="text-blue-600 font-medium text-sm mt-1">System Admin</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email Address</p>
                <p className="text-gray-900 font-medium mt-1">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Editable form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Admin Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isSaving} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 max-w-md text-gray-900 placeholder:text-gray-400" />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {isSaving && <LoadingSpinner size="sm" className="text-white" />}
                  {isSaving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
