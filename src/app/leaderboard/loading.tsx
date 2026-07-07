export default function Loading() {
  return (
    <div className="min-h-screen pt-8 pb-6 px-4 sm:px-6 relative overflow-hidden animate-pulse">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="w-64 h-16 bg-gray-200 rounded mx-auto mb-4" />
          <div className="w-96 h-6 bg-gray-200 rounded mx-auto" />
        </div>

        {/* Top 3 Podium Skeleton */}
        <div className="flex justify-center items-end gap-2 sm:gap-6 mb-16 mt-12 h-64">
          <div className="w-1/3 max-w-[140px] flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 mb-4" />
            <div className="w-full h-32 bg-gray-200 rounded-t-2xl" />
          </div>
          <div className="w-1/3 max-w-[160px] flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 mb-4" />
            <div className="w-full h-40 bg-gray-200 rounded-t-2xl" />
          </div>
          <div className="w-1/3 max-w-[140px] flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 mb-4" />
            <div className="w-full h-24 bg-gray-200 rounded-t-2xl" />
          </div>
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
