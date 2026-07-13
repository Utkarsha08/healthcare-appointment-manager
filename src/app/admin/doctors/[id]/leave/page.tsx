import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addLeaveDay } from "@/app/admin/doctors/actions";

const prisma = new PrismaClient();

export default async function AddLeaveDayPage({ params }: { params: { id: string } }) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!doctor) {
    notFound();
  }

  const addLeaveForDoctor = addLeaveDay.bind(null, doctor.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/doctors" className="text-gray-500 hover:text-gray-700">
          &larr; Back
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">Add Leave for {doctor.user.name}</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form action={addLeaveForDoctor} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <textarea
              name="reason"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="e.g. Sick leave, vacation..."
            ></textarea>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm"
            >
              Confirm Leave Day
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
