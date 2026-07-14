"use client";

import { useState } from "react";
import { cancelPatientAppointment } from "@/app/patient/actions";
import { useToast } from "@/lib/hooks/useToast";

export default function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { success, error } = useToast();

  const handleCancel = async () => {
    setIsLoading(true);
    const res = await cancelPatientAppointment(appointmentId);
    setIsLoading(false);
    setIsOpen(false);

    if (res?.error) {
      error(res.error);
    } else {
      success("Appointment cancelled successfully.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none w-full sm:w-auto"
      >
        Cancel
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this appointment? Your doctor will be notified.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
