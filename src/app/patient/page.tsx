import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { HistoryCard } from "@/components/HistoryCard";
import { UserMenu } from "@/components/UserMenu";
import CancelAppointmentButton from "@/components/CancelAppointmentButton";
import RescheduleAppointmentModal from "@/components/RescheduleAppointmentModal";

export default async function PatientPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PATIENT") {
    redirect("/login");
    return null;
  }

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId: session.user.id,
      status: { in: ["HELD", "CONFIRMED"] },
    },
    include: {
      doctor: { include: { user: true } },
    },
    orderBy: { slotStart: "asc" },
  });

  const previousAppointments = await prisma.appointment.findMany({
    where: {
      patientId: session.user.id,
      status: { in: ["COMPLETED", "CANCELLED", "LEAVE_CANCELLED"] },
    },
    include: {
      doctor: { include: { user: true } },
    },
    orderBy: { slotStart: "desc" },
  });

  const notifications = await prisma.notification.findMany({
    where: { recipient: session.user.email || "" },
    orderBy: { createdAt: "desc" },
    include: {
      appointment: {
        include: {
          doctor: {
            include: { user: true }
          }
        }
      }
    },
    take: 5,
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-xl font-bold text-gray-900 tracking-tight">
          <span className="text-blue-600">Health</span>Care
        </div>
        <UserMenu user={{
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          role: session.user.role as "ADMIN" | "DOCTOR" | "PATIENT",
        }} />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 shadow-sm gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Welcome, {session.user.name}</h1>
          <p className="text-blue-700 mt-2 text-lg">Manage your healthcare appointments easily and stay up to date.</p>
        </div>
        <Link
          href="/patient/doctors"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap"
        >
          Book New Appointment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Appointments */}
        <div className="lg:col-span-2 space-y-8">

          {/* Upcoming Appointments */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Upcoming Appointments
            </h2>
            {upcomingAppointments.length === 0 ? (
              <EmptyState
                title="No upcoming appointments."
                description="Book your first appointment to get started."
                icon={<svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="p-6 border border-blue-100 rounded-2xl bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:shadow-md hover:border-blue-300">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                          {appt.doctor.user.name.charAt(0)}
                       </div>
                       <div>
                         <div className="font-bold text-gray-900 text-lg">Dr. {appt.doctor.user.name}</div>
                         <div className="text-sm text-gray-500 font-medium">{appt.doctor.specialisation}</div>
                       </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {new Date(appt.slotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                      {appt.status === "CONFIRMED" && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <RescheduleAppointmentModal 
                            appointmentId={appt.id} 
                            doctorId={appt.doctorId}
                            slotDurationMin={appt.doctor.slotDurationMin}
                            currentSlotStart={appt.slotStart.toISOString()}
                          />
                          <CancelAppointmentButton appointmentId={appt.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Previous Appointments */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Medical History
            </h2>
            {previousAppointments.length === 0 ? (
              <EmptyState
                title="No consultation history yet."
                description="Your completed and cancelled appointments will appear here."
              />
            ) : (
              <div className="space-y-6">
                {previousAppointments.map((appt) => (
                  <HistoryCard key={appt.id} appt={appt} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Notifications & Status */}
        <div className="space-y-8">
          <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Recent Notifications
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {notifications.length === 0 ? (
                <EmptyState
                  title="No notifications yet."
                  description="Updates regarding your appointments will appear here."
                  className="bg-transparent border-dashed p-4"
                />
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => {
                    const message = notif.type.replace(/_/g, " ");

                    return (
                      <div key={notif.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-start gap-3">
                        <div className="mt-1">
                          {notif.type.toLowerCase().includes("cancel") ? (
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          ) : notif.type.toLowerCase().includes("confirm") ? (
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}