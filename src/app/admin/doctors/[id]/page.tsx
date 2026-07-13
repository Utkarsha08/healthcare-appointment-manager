import DoctorForm from "@/components/DoctorForm";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditDoctorPage({ params }: { params: { id: string } }) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!doctor) {
    notFound();
  }

  // We need to parse workingHours if it's stored as Prisma.JsonValue but actually it's automatically returned as any/object in Prisma.
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/doctors" className="text-gray-500 hover:text-gray-700">
          &larr; Back
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">Edit Doctor: {doctor.user.name}</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <DoctorForm doctor={doctor} />
      </div>
    </div>
  );
}
