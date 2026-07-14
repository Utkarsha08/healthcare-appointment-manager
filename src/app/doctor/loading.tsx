import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function DoctorLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-16">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
               <div className="space-y-3 flex-1">
                 <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                 <div className="h-6 bg-gray-300 rounded w-1/4 animate-pulse"></div>
               </div>
               <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
             <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
             {[...Array(3)].map((_, i) => (
               <SkeletonCard key={i} className="rounded-2xl border-gray-200" />
             ))}
          </div>
          <div className="space-y-4">
             <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-64 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
