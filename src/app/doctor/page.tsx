import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { doctorService, TodayAppointment } from "@/lib/services/doctorService";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
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
    <div className={`rounded-2xl shadow-sm p-6 mb-4 border transition-all ${isConfirmed ? 'bg-white border-blue-200 hover:shadow-md hover:border-blue-400 cursor-pointer' : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'}`}>
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{appointment.patient.name}</h3>
          <p className="text-sm font-medium text-gray-500 mt-1">{startTime} - {endTime}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge variant={appointment.status as BadgeVariant} />
          {appointment.preVisitSummary && (
            <Badge variant={appointment.preVisitSummary.urgencyLevel.toUpperCase() as BadgeVariant} />
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        {!appointment.preVisitSummary ? (
          <p className="text-gray-500 italic text-sm">AI summary unavailable</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chief Complaint</h4>
              <p className="text-sm text-gray-800 mt-1">{appointment.preVisitSummary.chiefComplaint}</p>
            </div>
            
            {appointment.symptoms && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Symptoms</h4>
                <p className="text-sm text-gray-800 mt-1">{appointment.symptoms}</p>
              </div>
            )}

            {appointment.preVisitSummary.suggestedQuestions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suggested Questions</h4>
                <ul className="list-disc list-inside text-sm text-gray-800 mt-1 space-y-1">
                  {appointment.preVisitSummary.suggestedQuestions.map((q, i) => (
                    <li key={i} className="pl-1">{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isConfirmed) {
    return <Link href={`/doctor/consultation/${appointment.id}`} className="block">{content}</Link>;
  }

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
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Today&apos;s Schedule</h2>
              <p className="text-gray-500 mt-1">Select a confirmed appointment to begin consultation.</p>
            </div>

            {appointments.length === 0 ? (
              <EmptyState 
                title="No Appointments"
                description="You have no appointments scheduled for today. Enjoy your day!"
              />
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            )}
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