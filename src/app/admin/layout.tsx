import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { UserMenu } from "@/components/UserMenu";

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
            href="/admin"
            className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/doctors"
            className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Doctors
          </Link>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-100 p-4 flex justify-end shadow-sm">
          <UserMenu user={{
            name: session.user.name ?? "User",
            email: session.user.email ?? "",
            role: session.user.role as "ADMIN" | "DOCTOR" | "PATIENT",
          }} />
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
