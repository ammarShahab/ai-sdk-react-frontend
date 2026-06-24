import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";

function App() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:3000/chat",
    }),
  });

  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const isReady = status === "ready";
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (isReady) {
      inputRef.current?.focus();
    }
  }, [isReady]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl h-[85vh] sm:h-[80vh] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              AI
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                AI Assistant
              </h1>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${isReady ? "bg-green-500" : "bg-amber-400 animate-pulse"}`}
                />
                <span className="text-xs text-slate-500 font-medium">
                  {isReady
                    ? "Online"
                    : isLoading
                      ? "Thinking..."
                      : "Connecting..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-slate-400"
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
              <div className="text-center">
                <p className="text-slate-600 font-medium text-lg">
                  Start a conversation
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Ask anything and the AI will respond
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-slate-700 border border-slate-200 rounded-bl-md"
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
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 sm:px-6 py-4 bg-white border-t border-slate-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && isReady) {
                sendMessage({ text: input });
                setInput("");
              }
            }}
            className="flex items-end gap-3"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isReady}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={!isReady || !input.trim()}
              className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
