export default function AccountsSkeleton() {
    return (
        <div className="space-y-10 pb-10 animate-pulse">
            {/* Header row */}
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="h-6 w-36 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-56 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-10 w-36 bg-gray-200 rounded-lg" />
            </div>

            {/* Account cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-5">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                                <div className="h-3 w-20 bg-gray-100 rounded" />
                                <div className="h-5 w-32 bg-gray-200 rounded" />
                            </div>
                            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                        </div>
                        <div className="space-y-1">
                            <div className="h-3 w-24 bg-gray-100 rounded" />
                            <div className="h-8 w-40 bg-gray-200 rounded" />
                        </div>
                        <div className="h-10 w-full bg-gray-100 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
