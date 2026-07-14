"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface NotificationProps {
  id: string;
  type: string;
  title: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationPanel({ initialNotifications }: { initialNotifications: NotificationProps[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const router = useRouter();

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/patient/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const response = await fetch(`/api/patient/notifications/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to dismiss notification", error);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <h3 className="text-sm font-medium text-gray-900">No notifications yet.</h3>
        <p className="text-xs text-gray-500 mt-1">Updates regarding your appointments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notif) => {
        const isReminder = notif.type === "MEDICATION_REMINDER";
        
        let displayTitle = notif.title;
        let displayMessage = notif.message;
        
        if (!displayTitle && !displayMessage) {
          // Fallback for legacy notifications
          displayTitle = notif.type.replace(/_/g, " ");
          displayMessage = "Please review your appointment details.";
        }

        return (
          <div 
            key={notif.id} 
            className={`p-4 border rounded-xl flex items-start gap-3 transition ${
              notif.isRead 
                ? "bg-white border-gray-100" 
                : "bg-blue-50 border-blue-200 shadow-sm"
            }`}
          >
            <div className="mt-1">
              {isReminder ? (
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
              ) : notif.type.toLowerCase().includes("cancel") ? (
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-200" />
              ) : notif.type.toLowerCase().includes("confirm") ? (
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className={`text-sm capitalize ${notif.isRead ? "font-semibold text-gray-900" : "font-bold text-blue-900"}`}>
                  {displayTitle}
                </p>
                <p className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              <p className={`text-sm mt-1 ${notif.isRead ? "text-gray-600" : "text-blue-800 font-medium"}`}>
                {displayMessage}
              </p>

              <div className="flex gap-4 mt-3">
                {!notif.isRead && (
                  <button 
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    Mark as Read
                  </button>
                )}
                <button 
                  onClick={() => handleDismiss(notif.id)}
                  className="text-xs font-medium text-gray-500 hover:text-red-600 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
