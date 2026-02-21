import { useState, useRef, useEffect } from "react";

const BOT_AVATAR = (
    <div className="w-7 h-7 rounded-full bg-[#0B3D91] flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
        </svg>
    </div>
);

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Hello. I'm VibeBank's virtual assistant. How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll on new messages
    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg = { role: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ message: text }),
            });

            if (!res.ok) throw new Error("API error");

            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: data.reply || "I'm sorry, I could not process your request." },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: "Assistant is currently unavailable. Please try again later.",
                    isError: true,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end">
            {/* Chat Panel */}
            {isOpen && (
                <div
                    className="mb-3 w-80 bg-white border border-gray-200 shadow-2xl flex flex-col"
                    style={{ height: "480px", borderRadius: "4px" }}
                >
                    {/* Header */}
                    <div className="bg-[#0B3D91] px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <div>
                                <p className="text-white text-sm font-bold tracking-wide">VibeBank Assistant</p>
                                <p className="text-blue-200 text-[10px] font-medium uppercase tracking-widest">Powered by AI</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-blue-200 hover:text-white transition-colors p-1"
                            aria-label="Close assistant"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 flex-shrink-0"></div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/40">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                {msg.role === "assistant" && BOT_AVATAR}

                                <div
                                    className={`max-w-[230px] px-3 py-2.5 text-xs leading-relaxed font-medium ${msg.role === "user"
                                        ? "bg-[#0B3D91] text-white rounded-tl-xl rounded-tr-sm rounded-bl-xl"
                                        : msg.isError
                                            ? "bg-red-50 text-red-700 border border-red-100 rounded-tr-xl rounded-tl-sm rounded-br-xl"
                                            : "bg-white text-gray-700 border border-gray-200 shadow-sm rounded-tr-xl rounded-tl-sm rounded-br-xl"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex items-end gap-2">
                                {BOT_AVATAR}
                                <div className="bg-white border border-gray-200 shadow-sm rounded-tr-xl rounded-tl-sm rounded-br-xl px-4 py-3 flex items-center space-x-1.5">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-200 flex-shrink-0"></div>

                    {/* Input */}
                    <div className="px-3 py-3 bg-white flex items-center gap-2 flex-shrink-0">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={500}
                            disabled={loading}
                            placeholder="Type your question..."
                            className="flex-1 text-xs text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 px-3 py-2.5 outline-none focus:border-[#0B3D91] focus:bg-white transition-colors disabled:opacity-50"
                            style={{ borderRadius: "3px" }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="bg-[#0B3D91] text-white p-2.5 hover:bg-[#082d6b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                            style={{ borderRadius: "3px" }}
                            aria-label="Send message"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-100 px-4 py-1.5 flex-shrink-0">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">
                            For informational purposes only · Not financial advice
                        </p>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-12 h-12 rounded-full bg-[#0B3D91] hover:bg-[#082d6b] shadow-lg hover:shadow-xl text-white flex items-center justify-center transition-all duration-200 active:scale-95"
                aria-label={isOpen ? "Close assistant" : "Open VibeBank Assistant"}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
