export default function DashboardSkeleton() {
    return (
        <div className="space-y-10 pb-10 animate-pulse">
            {/* Header row */}
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-64 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
            </div>

            {/* Summary card */}
            <div className="bg-gray-200 rounded-xl h-36" />

            {/* Account cards row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map(i => (
                    <div key={i} className="h-28 bg-gray-100 rounded-xl border border-gray-200" />
                ))}
            </div>

            {/* Transactions table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="h-12 bg-gray-50 border-b border-gray-200" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center space-x-4 px-8 py-5 border-b border-gray-100 last:border-0">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 w-40 bg-gray-200 rounded" />
                            <div className="h-3 w-24 bg-gray-100 rounded" />
                        </div>
                        <div className="h-4 w-20 bg-gray-200 rounded text-right" />
                    </div>
                ))}
            </div>
        </div>
    );
}
