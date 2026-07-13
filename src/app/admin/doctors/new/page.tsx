import DoctorForm from "@/components/DoctorForm";
import Link from "next/link";

export default function NewDoctorPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/doctors" className="text-gray-500 hover:text-gray-700">
          &larr; Back
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">Add New Doctor</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <DoctorForm />
      </div>
    </div>
  );
}
