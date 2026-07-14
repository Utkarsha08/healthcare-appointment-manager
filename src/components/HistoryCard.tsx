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
    <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <div className="font-bold text-gray-900 text-lg">
            Dr. {appt.doctor.user.name}
          </div>

          <div className="text-sm text-gray-600 font-medium mt-0.5">
            {appt.doctor.specialisation}
          </div>

          <div
            className="text-sm text-gray-500 mt-1 font-medium"
            suppressHydrationWarning
          >
            {formattedDate}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <Badge variant={appt.status as BadgeVariant} />

          {appt.status === "COMPLETED" && hasDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
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
            className="space-y-6 pt-6 border-t border-gray-100 mt-2"
          >
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">
                Visit Summary
              </h4>

              {appt.postVisitSummary ? (
                <div className="text-sm text-gray-700 bg-blue-50 p-5 rounded-xl border border-blue-100 whitespace-pre-wrap leading-relaxed">
                  {appt.postVisitSummary}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                  AI summary unavailable.
                </div>
              )}
            </div>

            {appt.doctorNotes && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">
                  Doctor&apos;s Notes
                </h4>

                <div className="text-sm text-gray-700 bg-green-50 p-5 rounded-xl border border-green-100 whitespace-pre-wrap leading-relaxed">
                  {appt.doctorNotes}
                </div>
              </div>
            )}

            {prescriptionList.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">
                  Prescription
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prescriptionList.map((med, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                    >
                      <div className="font-bold text-gray-900 mb-3">
                        {med.medicine}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dosage</span>
                          <span>{med.dosage}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">Frequency</span>
                          <span>{med.frequency}</span>
                        </div>

                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-500">Duration</span>
                          <span>{med.durationDays} days</span>
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