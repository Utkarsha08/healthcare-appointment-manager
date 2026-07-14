import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { doctorService, TodayAppointment } from "@/lib/services/doctorService";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

function AppointmentCard({ appointment }: { appointment: TodayAppointment }) {
  const timeFormat = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const startTime = timeFormat.format(new Date(appointment.slotStart));
  const endTime = timeFormat.format(new Date(appointment.slotEnd));

  const isConfirmed = appointment.status === "CONFIRMED";

  const content = (
    <div className={`rounded-3xl shadow-sm p-6 sm:p-8 mb-4 border transition-all ${isConfirmed ? 'bg-white border-blue-200 hover:shadow-md hover:border-blue-400' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{appointment.patient.name}</h3>
          <p className="text-base font-medium text-blue-600 mt-1 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {startTime} - {endTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Badge variant={appointment.status as BadgeVariant} />
          {appointment.preVisitSummary && (
            <Badge variant={appointment.preVisitSummary.urgencyLevel.toUpperCase() as BadgeVariant} />
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100">
        {!appointment.preVisitSummary ? (
          <p className="text-gray-500 italic text-sm bg-gray-50 p-4 rounded-xl">AI summary unavailable</p>
        ) : (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Chief Complaint</h4>
              <p className="text-sm text-gray-800 bg-blue-50/50 p-4 rounded-xl border border-blue-100">{appointment.preVisitSummary.chiefComplaint}</p>
            </div>

            {appointment.symptoms && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Symptoms</h4>
                <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100">{appointment.symptoms}</p>
              </div>
            )}

            {appointment.preVisitSummary.suggestedQuestions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Suggested Questions</h4>
                <ul className="list-disc list-inside text-sm text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                  {appointment.preVisitSummary.suggestedQuestions.map((q, i) => (
                    <li key={i} className="pl-1">{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {isConfirmed && (
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <Link
            href={`/doctor/consultation/${appointment.id}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Start Consultation
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      )}
    </div>
  );

  return content;
}

export default async function DoctorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const userId = session.user.id as string;
  const email = session.user.email as string;

  const appointments = await doctorService.getTodayAppointments(userId);

  const completedCount = appointments.filter(a => a.status === "COMPLETED").length;
  const remainingCount = appointments.filter(a => a.status === "CONFIRMED").length;
  const totalCount = appointments.length;

  const notifications = await prisma.notification.findMany({
    where: { recipient: email },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="text-xl font-bold text-gray-900 tracking-tight">
            <span className="text-blue-600">Doctor</span>Portal
          </div>
          <UserMenu user={{
            name: session.user.name ?? "User",
            email: session.user.email ?? "",
            role: session.user.role as "ADMIN" | "DOCTOR" | "PATIENT",
          }} />
        </div>

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalCount}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{completedCount}</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Remaining Today</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{remainingCount}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Appointments */}
          <div className="lg:col-span-2 space-y-10">
            {/* Current / Next Appointment */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Current / Next Appointment</h2>
                <p className="text-gray-500 mt-1">Select to begin consultation.</p>
              </div>

              {appointments.filter(a => a.status === "CONFIRMED").length === 0 ? (
                <EmptyState
                  title="No Upcoming Appointments"
                  description="You have no more confirmed appointments for today."
                  icon={<svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>}
                />
              ) : (
                <AppointmentCard appointment={appointments.filter(a => a.status === "CONFIRMED")[0]} />
              )}
            </section>

            {/* Later Today */}
            <section>
              <div className="mb-6 pt-6 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Later Today & Completed</h2>
                <p className="text-gray-500 mt-1">The rest of your schedule.</p>
              </div>

              {appointments.filter(a => a.id !== appointments.find(ap => ap.status === "CONFIRMED")?.id).length === 0 ? (
                <EmptyState
                  title="Schedule Clear"
                  description="No other appointments scheduled for today."
                />
              ) : (
                <div className="space-y-4">
                  {appointments.filter(a => a.id !== appointments.find(ap => ap.status === "CONFIRMED")?.id).map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar: Notifications */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h2>
              <p className="text-gray-500 mt-1">Recent updates and alerts.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {notifications.length === 0 ? (
                <EmptyState
                  title="No Notifications"
                  description="You're all caught up."
                  className="bg-transparent border-dashed p-4"
                />
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-start gap-3">
                      <div className="mt-1">
                        {notif.type.includes("cancel") ? (
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        ) : notif.type.includes("confirm") ? (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {notif.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notif.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}