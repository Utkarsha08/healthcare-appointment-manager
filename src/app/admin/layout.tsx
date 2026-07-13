import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider">HealthManager</h1>
          <p className="text-sm text-slate-400 mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link
            href="/admin/doctors"
            className="block px-4 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            Doctors
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <p className="text-sm">{session.user.name}</p>
          <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
