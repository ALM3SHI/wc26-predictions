export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-pulse">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="w-12 h-8 bg-gray-200 rounded-md" />
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-6">
        <div className="w-full h-[250px] md:h-[350px] bg-gray-200 rounded-[2rem]" />
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="h-24 bg-gray-200 rounded-2xl" />
          <div className="h-24 bg-gray-200 rounded-2xl" />
        </div>

        <div>
          <div className="w-32 h-6 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-square bg-gray-200 rounded-2xl" />
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
