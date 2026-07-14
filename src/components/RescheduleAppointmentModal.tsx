"use client";

import { useState, useEffect } from "react";
import { reschedulePatientAppointment } from "@/app/patient/actions";
import { useToast } from "@/lib/hooks/useToast";

export default function RescheduleAppointmentModal({ 
  appointmentId, 
  doctorId,
  slotDurationMin,
  currentSlotStart 
}: { 
  appointmentId: string, 
  doctorId: string,
  slotDurationMin: number,
  currentSlotStart: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<string>(new Date(currentSlotStart).toISOString().split("T")[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { success, error } = useToast();

  useEffect(() => {
    if (!isOpen || !date) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`);
        const data = await res.json();
        if (res.ok) setSlots(data.slots || []);
        else setErrorMsg(data.error);
      } catch {
        setErrorMsg("Failed to load slots.");
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [date, doctorId, isOpen]);

  const handleReschedule = async (slot: string) => {
    if (slot === currentSlotStart) {
      setErrorMsg("New slot is identical to current slot.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    
    const res = await reschedulePatientAppointment(appointmentId, slot, slotDurationMin);
    
    setActionLoading(false);
    
    if (res?.error) {
      setErrorMsg(res.error);
      error(res.error);
    } else {
      setIsOpen(false);
      success("Appointment rescheduled successfully.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-auto"
      >
        Reschedule
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reschedule Appointment</h3>
            <p className="text-gray-600 mb-6">
              Select a new date and time for your appointment.
            </p>

            {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{errorMsg}</div>}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available Slots</h3>
              {loadingSlots ? (
                <div className="text-gray-500 text-sm">Loading slots...</div>
              ) : slots.length === 0 ? (
                <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg border border-gray-100">No slots available on this date.</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {slots.map((slot) => {
                    const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isCurrent = slot === new Date(currentSlotStart).toISOString();
                    return (
                      <button
                        key={slot}
                        onClick={() => handleReschedule(slot)}
                        disabled={actionLoading || isCurrent}
                        className={`py-2 px-3 font-medium text-sm rounded-lg border transition disabled:opacity-50
                          ${isCurrent 
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                            : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border-blue-100'
                          }`}
                        title={isCurrent ? "Current appointment time" : ""}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
