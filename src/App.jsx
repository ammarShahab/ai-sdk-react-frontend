import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";

function App() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:3000/chat",
    }),
  });

  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  const isReady = status === "ready";
  const isLoading = status === "submitted" || status === "streaming";

  // Auto-resize textarea like ChatGPT
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

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#212121]/95 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-white">AI Assistant</h1>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isReady ? "bg-green-500" : "bg-amber-400 animate-pulse"
              }`}
            />
          </div>
        </div>
        {/* <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div> */}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty State - ChatGPT Style */
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-12 h-12 rounded-full bg-[#10a37f] flex items-center justify-center text-white font-bold text-xl mb-6">
              AI
            </div>
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">
              How can I help you today?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                "Explain quantum computing in simple terms",
                "Got any creative ideas for a 10 year old's birthday?",
                "How do I make an HTTP request in JavaScript?",
                "What are the differences between Python and JavaScript?",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left text-sm text-gray-300 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`py-6 px-4 sm:px-8 ${
                    isUser ? "bg-[#212121]" : "bg-[#2f2f2f]"
                  }`}
                >
                  <div className="max-w-3xl mx-auto flex gap-4">
                    {/* Avatar */}
                    <div className="shrink-0 mt-0.5">
                      {isUser ? (
                        <div className="w-7 h-7 rounded-full bg-[#5436da] flex items-center justify-center text-white text-xs font-medium">
                          U
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#10a37f] flex items-center justify-center text-white text-xs font-bold">
                          AI
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white mb-1">
                        {isUser ? "You" : "AI Assistant"}
                      </div>
                      <div className="text-[#ececec] text-sm leading-relaxed whitespace-pre-wrap">
                        {message.parts?.map((part, index) =>
                          part.type === "text" ? (
                            <span key={index}>{part.text}</span>
                          ) : null,
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="py-6 px-4 sm:px-8 bg-[#2f2f2f]">
                <div className="max-w-3xl mx-auto flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-[#10a37f] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    AI
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} className="h-8" />
          </div>
        )}
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="sticky bottom-0 bg-[#212121] px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end bg-[#2f2f2f] border border-white/10 rounded-2xl shadow-lg">
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
                className="w-full bg-transparent text-white placeholder-gray-500 text-sm px-4 py-3.5 pr-12 resize-none outline-none max-h-[200px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                style={{ minHeight: "52px" }}
              />
              <button
                type="submit"
                disabled={!isReady || !input.trim()}
                className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-[#10a37f] text-white hover:bg-[#0d8c6d] disabled:bg-transparent disabled:text-gray-600 transition-all"
              >
                Send
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              AI can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
