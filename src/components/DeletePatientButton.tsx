"use client";

import { useState } from "react";
import { deletePatientAccount } from "@/app/patient/profile/actions";
import { useToast } from "@/lib/hooks/useToast";
import { signOut } from "next-auth/react";

export default function DeletePatientButton({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { success, error } = useToast();

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    
    setIsLoading(true);
    const res = await deletePatientAccount(userId);

    if (res?.error) {
      setIsLoading(false);
      error(res.error);
      setIsOpen(false);
    } else {
      success("Account deleted successfully.");
      await signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors border border-red-200 mt-4"
      >
        Delete My Account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-gray-600 mb-4">
              This action is permanent and cannot be undone. All your appointments and personal data will be deleted.
            </p>
            <p className="text-gray-600 mb-2 text-sm font-medium">
              Please type <strong>DELETE</strong> to confirm.
            </p>
            
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none mb-6 text-gray-900 placeholder:text-gray-400"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setConfirmText("");
                }}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading || confirmText !== "DELETE"}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
