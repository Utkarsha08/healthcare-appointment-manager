"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

      router.push("/doctor");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Clinical Notes</h2>
        <textarea
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          rows={6}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
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
            className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            + Add Medicine
          </button>
        </div>

        {prescription.length === 0 ? (
          <p className="text-gray-500 text-sm italic py-4 bg-gray-50 rounded-lg text-center">No medicines added.</p>
        ) : (
          <div className="space-y-4">
            {prescription.map((med, index) => (
              <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Medicine Name</label>
                    <input
                      type="text"
                      value={med.medicine}
                      onChange={(e) => handleMedicineChange(index, "medicine", e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                      placeholder="e.g. 1-0-1 (Morning/Night)"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={med.durationDays}
                      onChange={(e) => handleMedicineChange(index, "durationDays", e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMedicine(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Remove Medicine"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {isSubmitting ? "Saving & Generating AI Summary..." : "Complete Consultation"}
        </button>
      </div>
    </form>
  );
}
