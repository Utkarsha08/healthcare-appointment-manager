"use client";

import { saveDoctor } from "@/app/admin/doctors/actions";

type DoctorFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctor?: any; // The doctor object with included user
};

export default function DoctorForm({ doctor }: DoctorFormProps) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const workingHours = doctor?.workingHours || {};

  return (
    <form action={(formData) => saveDoctor(doctor?.id || "", formData)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            defaultValue={doctor?.user?.name}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={doctor?.user?.email}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {!doctor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialisation</label>
          <input
            type="text"
            name="specialisation"
            defaultValue={doctor?.specialisation}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (Minutes)</label>
          <input
            type="number"
            name="slotDurationMin"
            defaultValue={doctor?.slotDurationMin || 20}
            required
            min="5"
            step="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Working Hours</h3>
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-16 font-medium text-gray-600 capitalize">{day}</div>
              <input
                type="time"
                name={`${day}_start`}
                defaultValue={workingHours[day]?.[0] || ""}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                name={`${day}_end`}
                defaultValue={workingHours[day]?.[1] || ""}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          {doctor ? "Update Doctor" : "Create Doctor"}
        </button>
      </div>
    </form>
  );
}
