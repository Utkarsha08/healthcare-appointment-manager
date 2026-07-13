import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin");
    if (session.user.role === "DOCTOR") redirect("/doctor");
    if (session.user.role === "PATIENT") redirect("/patient");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">HealthManager</h1>
        <p className="text-xl text-gray-500 max-w-lg">
          The modern platform for booking and managing healthcare appointments seamlessly.
        </p>
        <div>
          <Link
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
