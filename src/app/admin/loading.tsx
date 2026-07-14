

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="h-8 bg-gray-200 rounded w-64 mb-3 animate-pulse"></div>
        <div className="h-5 bg-gray-100 rounded w-96 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
