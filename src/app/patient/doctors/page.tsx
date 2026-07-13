"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DoctorDto = {
  id: string;
  specialisation: string;
  slotDurationMin: number;
  user: {
    name: string;
    email: string;
  };
  workingHours: Record<string, string[]>;
};

export default function DoctorSearchPage() {
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [specialisation, setSpecialisation] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async (spec?: string) => {
    setLoading(true);
    try {
      const url = spec ? `/api/doctors?specialisation=${encodeURIComponent(spec)}` : "/api/doctors";
      const res = await fetch(url);
      if (res.ok) {
        setDoctors(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors(specialisation);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/patient" className="text-gray-500 hover:text-gray-700 font-medium">&larr; Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
      </div>

      <form onSubmit={handleSearch} className="flex space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <input
          type="text"
          value={specialisation}
          onChange={(e) => setSpecialisation(e.target.value)}
          placeholder="Filter by specialisation (e.g. Cardiologist)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
          No doctors found matching your criteria.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900">{doc.user.name}</h3>
              <p className="text-blue-600 font-medium text-sm mt-1">{doc.specialisation}</p>
              
              <div className="mt-4 flex-1">
                <p className="text-sm text-gray-600"><span className="font-medium">Slot Duration:</span> {doc.slotDurationMin} mins</p>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Working Days:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.keys(doc.workingHours).map(day => (
                      <span key={day} className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase">{day}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/patient/doctors/${doc.id}`}
                  className="block text-center bg-blue-50 hover:bg-blue-100 text-blue-700 w-full py-2.5 rounded-lg font-medium transition"
                >
                  View & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
