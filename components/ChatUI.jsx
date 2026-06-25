import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";

function ChatUI() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:3000/chat",
    }),
  });

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  const isReady = status === "ready";
  const isLoading = status === "submitted" || status === "streaming";

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = window.innerHeight * 0.3;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (isReady) {
      inputRef.current?.focus();
    }
  }, [isReady]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && isReady) {
      sendMessage({ text: input });
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleNewChat = () => {
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
    setSidebarOpen(false);
  };

  const suggestions = [
    "Explain quantum computing in simple terms",
    "Got any creative ideas for a 10 year old's birthday?",
    "How do I make an HTTP request in JavaScript?",
    "What are the differences between Python and JavaScript?",
  ];

  return (
    <div className="flex h-screen w-full bg-white text-[#0d0d0d] font-sans overflow-hidden">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.5; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-10px); }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        .animate-typing { animation: typing 1.4s infinite; }
        .typing-delay-1 { animation-delay: 0.2s; }
        .typing-delay-2 { animation-delay: 0.4s; }
        .custom-scroll::-webkit-scrollbar { width: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative left-0 top-0 z-[100] w-[260px] h-screen bg-white border-r border-gray-300 flex flex-col p-4 overflow-y-auto transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-lg font-semibold text-[#0d0d0d]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            AI Assistant
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden bg-none border-none cursor-pointer text-gray-500 text-lg p-1 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full px-4 py-3 mb-4 bg-white border border-gray-300 rounded-lg cursor-pointer text-sm text-[#0d0d0d] font-medium flex items-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New chat
        </button>

        {/* Chat History */}
        <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
          Today
        </div>
        <div className="flex-1 overflow-y-auto mb-4 space-y-1 sidebar-scroll">
          {["What is artificial intelligence?"].map((item, i) => (
            <button
              key={i}
              onClick={() => setSidebarOpen(false)}
              className={`w-full p-3 rounded-lg text-left text-sm flex items-center gap-2 truncate transition-all ${
                i === 0
                  ? "bg-gray-200 text-[#0d0d0d]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-[#0d0d0d]"
              }`}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              {item}
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-gray-200 flex flex-col gap-1">
          <button className="w-full p-3 rounded-lg text-left text-sm text-gray-500 flex items-center gap-2 hover:bg-gray-100 hover:text-[#0d0d0d] transition-all">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Upgrade to Plus
          </button>
          <button className="w-full p-3 rounded-lg text-left text-sm text-gray-500 flex items-center gap-2 hover:bg-gray-100 hover:text-[#0d0d0d] transition-all">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
          <button className="w-full p-3 rounded-lg text-left text-sm text-gray-500 flex items-center gap-2 hover:bg-gray-100 hover:text-[#0d0d0d] transition-all">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[99] transition-opacity md:hidden ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main Chat */}
      <main className="flex-1 flex flex-col h-screen bg-white min-w-0">
        {/* Chat Header */}
        <header className="px-4 md:px-6 py-4 border-b border-gray-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#0d0d0d]">
              AI Assistant
            </h1>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isReady ? "bg-green-500" : "bg-amber-400 animate-pulse"
              }`}
              title={
                isReady ? "Online" : isLoading ? "Thinking..." : "Connecting..."
              }
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-[#0d0d0d] transition-all md:hidden"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={handleNewChat}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-[#0d0d0d] transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-[#0d0d0d] transition-all">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 custom-scroll">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-gray-400 text-center">
              <div className="text-6xl opacity-30">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#0d0d0d] mb-1">
                  How can I help you today?
                </div>
                <div className="text-sm text-gray-400">
                  Ask me anything or start a new topic
                </div>
              </div>
              {/* Suggestion cards from File 1, styled for light theme */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-4 px-4">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all text-left text-sm text-gray-600 hover:text-[#0d0d0d]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 animate-slide-in ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-sm font-semibold shrink-0 select-none">
                          AI
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] md:max-w-[70%] px-4 py-3 text-[15px] leading-relaxed break-words ${
                          isUser
                            ? "bg-[#10a37f] text-white rounded-[18px]"
                            : "bg-[#f7f7f7] text-[#0d0d0d] border border-gray-200 rounded-xl"
                        }`}
                      >
                        {message.parts?.map((part, index) =>
                          part.type === "text" ? (
                            <span key={index} className="whitespace-pre-wrap">
                              {part.text}
                            </span>
                          ) : null,
                        )}
                      </div>
                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center text-sm font-semibold shrink-0 select-none">
                          U
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex gap-3 animate-slide-in">
                    <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-sm font-semibold shrink-0 select-none">
                      AI
                    </div>
                    <div className="flex gap-1 px-4 py-3 bg-[#f7f7f7] border border-gray-200 rounded-xl w-fit">
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing" />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing typing-delay-1" />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing typing-delay-2" />
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} className="h-4" />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 md:px-6 py-5 bg-white border-t border-gray-300 shrink-0">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex gap-3"
          >
            <div className="flex-1 relative">
              <textarea
                ref={(el) => {
                  textareaRef.current = el;
                  inputRef.current = el;
                }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isReady}
                placeholder="Message AI Assistant..."
                rows={1}
                className="w-full px-4 py-3 bg-[#f7f7f7] border border-gray-300 rounded-lg text-[15px] text-[#0d0d0d] placeholder-gray-400 resize-none outline-none transition-all focus:bg-white focus:border-[#10a37f] focus:shadow-[0_0_0_3px_rgba(16,163,127,0.1)] disabled:opacity-50 disabled:cursor-not-allowed custom-scroll"
                style={{ minHeight: "44px", maxHeight: "200px" }}
              />
            </div>
            <button
              type="submit"
              disabled={!isReady || !input.trim()}
              className="px-4 py-3 bg-[#10a37f] text-white rounded-lg hover:bg-[#1a7f64] active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 transition-all flex items-center justify-center shrink-0"
              style={{ minWidth: "44px", height: "44px" }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default ChatUI;
