import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import BookingClient from "./BookingClient";

export default async function DoctorDetailsPage({ params }: { params: { doctorId: string } }) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.doctorId },
    include: { user: true },
  });

  if (!doctor) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/patient/doctors" className="text-gray-500 hover:text-gray-700 font-medium">&larr; Back to Search</Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{doctor.user.name}</h1>
          <p className="text-blue-600 font-medium mt-1">{doctor.specialisation}</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-sm text-gray-600">Slot Duration</p>
          <p className="font-semibold">{doctor.slotDurationMin} mins</p>
        </div>
      </div>

      {/* Client component for 2-phase booking flow */}
      <BookingClient doctorId={doctor.id} slotDurationMin={doctor.slotDurationMin} />
    </div>
  );
}
