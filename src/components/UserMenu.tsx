"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "DOCTOR" | "PATIENT";
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const initials = user.name
    ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  const getProfileLink = () => {
    switch (user.role) {
      case "ADMIN":
        return "/admin/profile";
      case "DOCTOR":
        return "/doctor/profile";
      default:
        return "/patient/profile";
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          {initials}
        </div>
        <div className="hidden md:flex flex-col items-start mr-2">
          <span className="text-sm font-bold text-gray-900">{user.name}</span>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 rounded">{user.role}</span>
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""} hidden md:block`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-3 border-b border-gray-100 md:hidden">
             <p className="text-sm font-bold text-gray-900">{user.name}</p>
             <p className="text-xs text-gray-500 truncate">{user.email}</p>
             <span className="inline-block mt-1 text-xs font-medium text-blue-600 bg-blue-50 px-1.5 rounded">{user.role}</span>
          </div>
          <div className="px-4 py-3 border-b border-gray-100 hidden md:block">
             <p className="text-sm font-bold text-gray-900">{user.name}</p>
             <p className="text-xs text-gray-500 truncate">{user.email}</p>
             <span className="inline-block mt-1 text-xs font-medium text-blue-600 bg-blue-50 px-1.5 rounded">{user.role}</span>
          </div>
          
          <div className="py-1">
            <Link
              href={getProfileLink()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              My Profile
            </Link>
            <Link
              href="/change-password"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              Change Password
            </Link>
          </div>
          
          <div className="py-1 border-t border-gray-100">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
