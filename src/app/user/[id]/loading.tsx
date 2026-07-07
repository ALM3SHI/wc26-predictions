export default function Loading() {
  return (
    <div className="min-h-screen pt-8 pb-24 px-4 relative overflow-hidden animate-pulse">
      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Profile Header Skeleton */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gray-200 mb-6" />
          <div className="w-48 h-10 bg-gray-200 rounded mb-4" />
          
          <div className="flex gap-8 mt-6">
            <div className="flex flex-col items-center">
              <div className="w-16 h-12 bg-gray-200 rounded mb-2" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-12 bg-gray-200 rounded mb-2" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-12 bg-gray-200 rounded mb-2" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="flex justify-center mb-8 gap-4">
          <div className="w-32 h-10 bg-gray-200 rounded-xl" />
          <div className="w-32 h-10 bg-gray-200 rounded-xl" />
        </div>

        {/* Predictions List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
