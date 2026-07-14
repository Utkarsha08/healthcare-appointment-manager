"use client";

import { useState, useRef, useEffect } from "react";
import { Badge, BadgeVariant } from "@/components/ui/Badge";

interface PrescriptionMedicine {
  medicine: string;
  dosage: string;
  frequency: string;
  durationDays: number;
}

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
  const [contentHeight, setContentHeight] = useState(0);

  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded]);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    setFormattedDate(formatter.format(new Date(appt.slotStart)));
  }, [appt.slotStart]);

  const prescriptionList = Array.isArray(appt.prescription)
    ? (appt.prescription as PrescriptionMedicine[])
    : [];

  const hasDetails =
    !!appt.postVisitSummary ||
    !!appt.doctorNotes ||
    prescriptionList.length > 0;

  return (
    <div className="p-6 sm:p-8 border-2 border-gray-100 rounded-3xl bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
        <div>
          <div className="font-extrabold text-gray-900 text-xl">
            Dr. {appt.doctor.user.name}
          </div>

          <div className="text-base text-gray-600 font-medium mt-1">
            {appt.doctor.specialisation}
          </div>

          <div
            className="text-sm text-gray-400 mt-2 font-medium flex items-center gap-2"
            suppressHydrationWarning
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {formattedDate}
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
          <Badge variant={appt.status as BadgeVariant} />

          {appt.status === "COMPLETED" && hasDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-auto"
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
            transition: "all 300ms ease",
          }}
        >
          <div
            ref={contentRef}
            className="space-y-8 pt-8 border-t border-gray-100 mt-6"
          >
            {/* Visit Summary */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Visit Summary
              </h4>

              {appt.postVisitSummary ? (
                <div className="text-sm text-gray-800 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {appt.postVisitSummary}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  AI summary unavailable.
                </div>
              )}
            </div>

            {/* Doctor's Notes */}
            {appt.doctorNotes && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Doctor&apos;s Notes
                </h4>

                <div className="text-sm text-gray-800 bg-green-50/50 p-5 rounded-2xl border border-green-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {appt.doctorNotes}
                </div>
              </div>
            )}

            {/* Prescription */}
            {prescriptionList.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Prescription
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prescriptionList.map((med, index) => (
                    <div
                      key={index}
                      className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors"
                    >
                      <div className="font-bold text-gray-900 mb-4 text-base border-b border-gray-50 pb-2">
                        {med.medicine}
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Dosage</span>
                          <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded">{med.dosage}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Frequency</span>
                          <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded">{med.frequency}</span>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-1">
                          <span className="text-gray-500">Duration</span>
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">{med.durationDays} days</span>
                        </div>
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