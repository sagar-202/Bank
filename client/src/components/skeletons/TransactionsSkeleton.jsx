export default function TransactionsSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="h-14 bg-gray-50 border-b border-gray-200" />
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex items-center px-8 py-6 border-b border-gray-100 last:border-0 space-x-6">
                        <div className="h-4 w-36 bg-gray-200 rounded" />
                        <div className="h-4 w-24 bg-gray-100 rounded" />
                        <div className="flex-1 h-4 w-40 bg-gray-100 rounded" />
                        <div className="h-6 w-16 bg-gray-200 rounded-lg" />
                        <div className="h-4 w-24 bg-gray-200 rounded ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
}
