import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PatientPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const now = new Date();

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId: session.user.id,
      status: "CONFIRMED",
      slotStart: { gte: now },
    },
    include: {
      doctor: { include: { user: true } },
    },
    orderBy: { slotStart: "asc" },
  });

  const previousAppointments = await prisma.appointment.findMany({
    where: {
      patientId: session.user.id,
      status: { in: ["CONFIRMED", "COMPLETED", "CANCELLED", "LEAVE_CANCELLED"] },
      slotStart: { lt: now },
    },
    include: {
      doctor: { include: { user: true } },
    },
    orderBy: { slotStart: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Welcome, {session.user.name}</h1>
          <p className="text-blue-700 mt-1">Manage your healthcare appointments easily.</p>
        </div>
        <Link
          href="/patient/doctors"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition"
        >
          Search Doctors
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <div className="text-gray-500 text-sm py-4">No upcoming appointments.</div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appt) => (
                <div key={appt.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="font-semibold text-gray-900">{appt.doctor.user.name}</div>
                  <div className="text-sm text-gray-600">{appt.doctor.specialisation}</div>
                  <div className="mt-2 text-sm font-medium text-blue-700 bg-blue-100 inline-block px-3 py-1 rounded-md">
                    {new Date(appt.slotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Previous Appointments</h2>
          {previousAppointments.length === 0 ? (
            <div className="text-gray-500 text-sm py-4">No previous appointments.</div>
          ) : (
            <div className="space-y-4">
              {previousAppointments.map((appt) => (
                <div key={appt.id} className="p-4 border border-gray-100 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{appt.doctor.user.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(appt.slotStart).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      appt.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      appt.status === "LEAVE_CANCELLED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}