"use client";

import { useState } from "react";
import { deleteDoctor } from "@/app/admin/doctors/actions";
import { useToast } from "@/lib/hooks/useToast";
import { useRouter } from "next/navigation";

export default function DeleteDoctorButton({ doctorId }: { doctorId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    const res = await deleteDoctor(doctorId);
    setIsLoading(false);

    if (res?.error) {
      error(res.error);
      setIsOpen(false);
    } else {
      success("Doctor deleted successfully.");
      router.push("/admin/doctors");
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors border border-red-200"
      >
        Delete Doctor
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Doctor?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this doctor? This action is permanent and cannot be undone. All associated leave days and appointments will be deleted.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? "Deleting..." : "Delete Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
