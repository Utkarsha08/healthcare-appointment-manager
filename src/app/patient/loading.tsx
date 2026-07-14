import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function PatientLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-16">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-sm gap-6">
        <div className="space-y-4 w-full md:w-1/2">
          <div className="h-10 bg-gray-300 rounded w-3/4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
        <div className="w-full md:w-48 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
            <div className="space-y-4">
               {[...Array(2)].map((_, i) => (
                 <SkeletonCard key={i} className="rounded-2xl border-gray-200" />
               ))}
            </div>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
            <div className="space-y-4">
               {[...Array(3)].map((_, i) => (
                 <SkeletonCard key={i} className="rounded-2xl border-gray-200" />
               ))}
            </div>
          </section>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-64 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
