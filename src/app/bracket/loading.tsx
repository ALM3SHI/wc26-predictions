export default function Loading() {
  return (
    <div className="min-h-screen pt-8 pb-6 px-4 relative overflow-hidden animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:h-[80vh]">
        {/* Knockout Bracket Skeleton */}
        <div className="w-full lg:w-3/4 bg-white/50 rounded-2xl border border-gray-200 p-4 shadow-sm relative z-10 flex flex-col">
          <div className="w-48 h-8 bg-gray-200 rounded mb-8 self-center" />
          <div className="flex-1 flex space-x-4 lg:space-x-12 px-4 pb-4">
            {[1, 2, 3, 4, 5].map((col) => (
              <div key={col} className="flex-1 flex flex-col justify-around gap-4 min-w-[200px]">
                {Array.from({ length: col === 1 ? 8 : col === 2 ? 4 : col === 3 ? 2 : col === 4 ? 2 : 1 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Matches List Skeleton */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4 relative z-10">
          <div className="bg-white/80 p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="w-24 h-6 bg-gray-200 rounded" />
            <div className="w-6 h-6 bg-gray-200 rounded" />
          </div>
          <div className="bg-white/50 p-4 rounded-2xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
