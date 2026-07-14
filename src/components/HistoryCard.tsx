"use client";

import { useState, useRef, useEffect } from "react";
import { Badge, BadgeVariant } from "@/components/ui/Badge";

interface HistoryCardProps {
  appt: {
    id: string;
    slotStart: Date;
    status: string;
    postVisitSummary: string | null;
    doctorNotes: string | null;
    prescription: unknown;
    doctor: {
      specialisation: string;
      user: {
        name: string;
      };
    };
  };
}

export function HistoryCard({ appt }: HistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [appt, isExpanded]);

  const hasDetails = appt.postVisitSummary || appt.doctorNotes || (appt.prescription && Array.isArray(appt.prescription) && appt.prescription.length > 0);

  return (
    <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <div className="font-bold text-gray-900 text-lg">Dr. {appt.doctor.user.name}</div>
          <div className="text-sm text-gray-600 font-medium mt-0.5">{appt.doctor.specialisation}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">
            {new Date(appt.slotStart).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge variant={appt.status as BadgeVariant} />
          {appt.status === "COMPLETED" && hasDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
              aria-expanded={isExpanded}
            >
              {isExpanded ? "Hide Details" : "View Details"}
            </button>
          )}
        </div>
      </div>

      {appt.status === "COMPLETED" && (
        <div
          style={{
            maxHeight: isExpanded ? `${contentHeight}px` : "0px",
            opacity: isExpanded ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.3s ease-in-out",
          }}
        >
          <div ref={contentRef} className="space-y-6 pt-6 border-t border-gray-100 mt-2">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Visit Summary
              </h4>
              {appt.postVisitSummary ? (
                <div className="text-sm text-gray-700 bg-blue-50/50 p-5 rounded-xl border border-blue-100 whitespace-pre-wrap leading-relaxed">
                  {appt.postVisitSummary}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">AI summary unavailable.</p>
              )}
            </div>
            
            {appt.doctorNotes && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Doctor&apos;s Notes
                </h4>
                <div className="text-sm text-gray-700 bg-green-50/50 p-5 rounded-xl border border-green-100 whitespace-pre-wrap leading-relaxed">
                  {appt.doctorNotes}
                </div>
              </div>
            )}

            {appt.prescription && Array.isArray(appt.prescription) && appt.prescription.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Prescription
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(appt.prescription as unknown as Array<{medicine: string; dosage: string; frequency: string; durationDays: number}>).map((med, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition hover:border-blue-300">
                      <div className="font-bold text-gray-900 text-sm mb-2">{med.medicine}</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between"><span className="text-gray-400">Dosage</span> <span className="font-medium text-gray-800">{med.dosage}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Frequency</span> <span className="font-medium text-gray-800">{med.frequency}</span></div>
                        <div className="flex justify-between pt-1 mt-1 border-t border-gray-50"><span className="text-gray-400">Duration</span> <span className="font-medium text-gray-800">{med.durationDays} days</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
