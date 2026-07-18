export default function CustomerOrderDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-12">
      <div className="space-y-6">
        <div className="h-4 w-32 bg-gray-200"></div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="h-4 w-4 rounded-full bg-gray-200"></div>
            <div className="h-4 w-48 bg-gray-200"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-4 rounded-full bg-gray-200"></div>
            <div className="h-4 w-32 bg-gray-200"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-4 rounded-full bg-gray-200"></div>
            <div className="h-4 w-40 bg-gray-200"></div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#cfc4c5] pt-8">
        <div className="mb-6 h-4 w-40 bg-gray-200"></div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-[#cfc4c5]/20 pb-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-12 bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-3 w-32 bg-gray-200"></div>
                  <div className="h-2 w-24 bg-gray-200"></div>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <div className="ml-auto h-3 w-16 bg-gray-200"></div>
                <div className="ml-auto h-2 w-20 bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
