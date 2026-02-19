import { useNavigate } from "react-router-dom";

export default function Transfer() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12 flex flex-col items-center font-sans text-gray-900">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl text-center">

                <h1 className="text-2xl font-bold tracking-tight mb-2">Transfer Money</h1>

                <div className="py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-lg text-gray-600 font-medium">Feature coming soon</p>
                    <p className="text-sm text-gray-400 mt-1">We are working hard to bring this to you.</p>
                </div>

                <div className="mt-4">
                    <button
                        onClick={() => navigate("/home")}
                        className="w-full bg-gray-100 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>

            </div>
        </div>
    );
}
