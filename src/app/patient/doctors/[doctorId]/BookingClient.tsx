"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BookingClient({ doctorId, slotDurationMin }: { doctorId: string, slotDurationMin: number }) {
  const router = useRouter();
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Booking State
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [heldAppointmentId, setHeldAppointmentId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
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
  }, [date, doctorId]);

  const handleHoldSlot = async (slot: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/appointments/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, slotStart: slot, slotDurationMin })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setHeldAppointmentId(data.id);
        setSelectedSlot(slot);
        setStep(2);
      } else {
        setErrorMsg(data.error || "Failed to hold slot.");
        if (res.status === 409) {
          // Refresh slots if conflicted
          const refreshRes = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`);
          if (refreshRes.ok) setSlots((await refreshRes.json()).slots);
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heldAppointmentId || !symptoms || actionLoading) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/appointments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: heldAppointmentId, symptoms })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Success
        router.push("/patient");
        router.refresh();
      } else {
        setErrorMsg(data.error || "Failed to confirm booking.");
        if (res.status === 410) {
          // Expired, reset flow
          setStep(1);
          setHeldAppointmentId(null);
          setSelectedSlot(null);
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Step 1: Select Date & Time</h2>
        
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

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Available Slots</h3>
          {loadingSlots ? (
            <div className="text-gray-500 text-sm">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg border border-gray-100">No slots available on this date.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {slots.map((slot) => {
                const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <button
                    key={slot}
                    onClick={() => handleHoldSlot(slot)}
                    disabled={actionLoading}
                    className="py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-medium text-sm rounded-lg border border-blue-100 transition disabled:opacity-50"
                  >
                    {timeStr}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Step 2: Confirm Booking</h2>
          <p className="text-sm text-green-600 font-medium mt-1">✓ Slot Held Successfully! You have 5 minutes to confirm.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Selected Time</p>
          <p className="font-semibold text-gray-900">
            {selectedSlot ? new Date(selectedSlot).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : ""}
          </p>
        </div>
      </div>

      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{errorMsg}</div>}

      <form onSubmit={handleConfirm} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms & Reason for Visit</label>
          <textarea
            required
            rows={4}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Please describe your symptoms, duration, pain level, and any questions you have..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">Our AI assistant will analyze this to prepare the doctor before your visit.</p>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setHeldAppointmentId(null);
            }}
            disabled={actionLoading}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex-1 text-center"
          >
            {actionLoading ? "Confirming..." : "Confirm Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
