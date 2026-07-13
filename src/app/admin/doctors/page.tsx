import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DoctorsListPage() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Doctors</h2>
        <Link
          href="/admin/doctors/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          Add New Doctor
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">Name</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Specialisation</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Slot (mins)</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{doctor.user.name}</div>
                  <div className="text-sm text-gray-500">{doctor.user.email}</div>
                </td>
                <td className="px-6 py-4 text-gray-700">{doctor.specialisation}</td>
                <td className="px-6 py-4 text-gray-700">{doctor.slotDurationMin}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <Link
                    href={`/admin/doctors/${doctor.id}/leave`}
                    className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Add Leave
                  </Link>
                  <Link
                    href={`/admin/doctors/${doctor.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No doctors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
