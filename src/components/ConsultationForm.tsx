"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Medicine {
  medicine: string;
  dosage: string;
  frequency: string;
  durationDays: number | "";
}

export default function ConsultationForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [doctorNotes, setDoctorNotes] = useState("");
  const [prescription, setPrescription] = useState<Medicine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleAddMedicine = () => {
    setPrescription([...prescription, { medicine: "", dosage: "", frequency: "", durationDays: "" }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescription(prescription.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof Medicine, value: string | number) => {
    const updated = [...prescription];
    updated[index] = { ...updated[index], [field]: value };
    setPrescription(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/doctor/appointments/${appointmentId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorNotes,
          prescription: prescription.map((p) => ({
            ...p,
            durationDays: p.durationDays === "" ? 0 : Number(p.durationDays),
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save consultation");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/doctor");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsSubmitting(false); // only enable button again if error
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="space-y-4">
        <label className="text-xl font-bold text-gray-900 block" htmlFor="clinical-notes">Clinical Notes</label>
        <textarea
          id="clinical-notes"
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          rows={8}
          className="w-full"
          placeholder="Enter detailed clinical observations, diagnosis, and treatment plan here..."
          required
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Prescription Builder</h2>
          <button
            type="button"
            onClick={handleAddMedicine}
            disabled={isSubmitting || isSuccess}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 border border-transparent hover:border-blue-200"
            aria-label="Add Medicine"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Add Medicine
          </button>
        </div>

        {prescription.length === 0 ? (
          <p className="text-gray-500 text-sm italic py-4 bg-gray-50 rounded-lg text-center">No medicines added.</p>
        ) : (
          <div className="space-y-6">
            {prescription.map((med, index) => (
              <div key={index} className="flex gap-4 items-start bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm relative">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 pr-8 md:pr-0">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Medicine Name</label>
                    <input
                      type="text"
                      value={med.medicine}
                      onChange={(e) => handleMedicineChange(index, "medicine", e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                      placeholder="e.g. 500mg"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Frequency</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                      placeholder="e.g. 1-0-1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      Examples: 1-0-1, 1-1-1, Twice Daily, Night
                    </p>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={med.durationDays}
                      onChange={(e) => handleMedicineChange(index, "durationDays", e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                {/* Delete Button aligned to top-right on mobile, centered on desktop */}
                <button
                  type="button"
                  onClick={() => handleRemoveMedicine(index)}
                  disabled={isSubmitting || isSuccess}
                  className="absolute right-4 top-4 md:static md:mt-8 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 p-2.5 rounded-full border border-transparent hover:border-red-100 transition-colors disabled:opacity-50 shadow-sm"
                  title="Remove Medicine"
                  aria-label={`Remove medicine ${med.medicine || `at index ${index}`}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <Alert type="error" message={error} />}
      {isSuccess && <Alert type="success" message="Consultation completed successfully." />}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && <LoadingSpinner size="sm" className="text-white" />}
          {isSubmitting ? "Completing..." : "Complete Consultation"}
        </button>
      </div>
    </form>
  );
}
