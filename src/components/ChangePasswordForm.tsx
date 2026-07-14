"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { UserMenu } from "@/components/UserMenu";

interface ChangePasswordFormProps {
    user: {
        name: string;
        email: string;
        role: "ADMIN" | "DOCTOR" | "PATIENT";
    };
}

export default function ChangePasswordForm({
    user,
}: ChangePasswordFormProps) {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const getBackLink = () => {
        if (user.role === "ADMIN") return "/admin/doctors";
        if (user.role === "DOCTOR") return "/doctor";
        return "/patient";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to change password");
            }

            setSuccess("Password changed successfully.");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 space-y-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <Link
                        href={getBackLink()}
                        className="text-gray-500 hover:text-blue-600 transition"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                    </Link>

                    <div className="text-xl font-bold text-gray-900 tracking-tight">
                        Security Settings
                    </div>
                </div>

                <UserMenu user={user} />
            </div>

            <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Change Password
                    </h2>

                    <p className="text-gray-500 mt-1">
                        Ensure your account is using a long, random password to stay
                        secure.
                    </p>
                </div>

                {error && (
                    <Alert
                        type="error"
                        message={error}
                        className="mb-6"
                    />
                )}

                {success && (
                    <Alert
                        type="success"
                        message={success}
                        className="mb-6"
                    />
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password *
                        </label>

                        <input
                            type="password"
                            required
                            disabled={isLoading}
                            value={currentPassword}
                            onChange={(e) =>
                                setCurrentPassword(e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password *
                        </label>

                        <input
                            type="password"
                            required
                            minLength={8}
                            disabled={isLoading}
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        />

                        <p className="text-xs text-gray-500 mt-1">
                            Must be at least 8 characters long.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password *
                        </label>

                        <input
                            type="password"
                            required
                            minLength={8}
                            disabled={isLoading}
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading && (
                                <LoadingSpinner
                                    size="sm"
                                    className="text-white"
                                />
                            )}

                            {isLoading
                                ? "Updating Password..."
                                : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}