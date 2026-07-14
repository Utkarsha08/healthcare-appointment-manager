import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { doctorService, TodayAppointment } from "@/lib/services/doctorService";

import Link from "next/link";

function UrgencyBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const colors = {
    Low: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${colors[level]}`}>
      {level} Urgency
    </span>
  );
}

function AppointmentCard({ appointment }: { appointment: TodayAppointment }) {
  const timeFormat = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const startTime = timeFormat.format(new Date(appointment.slotStart));
  const endTime = timeFormat.format(new Date(appointment.slotEnd));

  return (
    <Link href={`/doctor/consultation/${appointment.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{appointment.patient.name}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">{startTime} - {endTime}</p>
          </div>
          {appointment.preVisitSummary && (
            <UrgencyBadge level={appointment.preVisitSummary.urgencyLevel} />
          )}
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
    </Link>
  );
}

export default async function DoctorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  // Type assertion for session.user.id is necessary if next-auth types aren't fully configured
  const userId = session.user.id as string;
  const appointments = await doctorService.getTodayAppointments(userId);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Today&apos;s Appointments</h1>
          <p className="text-gray-500 mt-2 text-lg">Here is your schedule for today.</p>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No appointments scheduled for today.</h3>
            <p className="text-gray-500 mt-2">Enjoy your day or check back later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}