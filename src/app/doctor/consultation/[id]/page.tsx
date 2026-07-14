import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConsultationForm from "@/components/ConsultationForm";
import Link from "next/link";
import { PreVisitSummary } from "@/lib/ai/types";

function UrgencyBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const colors = {
    Low: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors[level]}`}>
      {level} Urgency
    </span>
  );
}

export default async function ConsultationPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: true,
    },
  });

  if (!appointment) {
    redirect("/doctor");
  }

  if (appointment.doctor.userId !== session.user.id) {
    redirect("/doctor");
  }

  if (appointment.status !== "CONFIRMED") {
    redirect("/doctor");
  }

  const timeFormat = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const startTime = timeFormat.format(new Date(appointment.slotStart));
  const endTime = timeFormat.format(new Date(appointment.slotEnd));
  const preVisitSummary = appointment.preVisitSummary as unknown as PreVisitSummary | null;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/doctor" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Active Consultation</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Patient Information</h2>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900 text-lg">{appointment.patient.name}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Scheduled Time</p>
                <p className="font-medium text-gray-900">{new Date(appointment.slotStart).toLocaleDateString()} {startTime} - {endTime}</p>
              </div>
              {preVisitSummary && (
                <div className="mt-4">
                  <UrgencyBadge level={preVisitSummary.urgencyLevel} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pre-Visit AI Summary</h2>
              {!preVisitSummary ? (
                <p className="text-gray-500 italic text-sm">AI summary unavailable.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chief Complaint</h4>
                    <p className="text-sm text-gray-800 mt-1">{preVisitSummary.chiefComplaint}</p>
                  </div>

                  {appointment.symptoms && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Symptoms</h4>
                      <p className="text-sm text-gray-800 mt-1">{appointment.symptoms}</p>
                    </div>
                  )}

                  {preVisitSummary.suggestedQuestions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suggested Questions</h4>
                      <ul className="list-disc list-inside text-sm text-gray-800 mt-1 space-y-1">
                        {preVisitSummary.suggestedQuestions.map((q, i) => (
                          <li key={i} className="pl-1">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <ConsultationForm appointmentId={appointment.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
