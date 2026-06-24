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

  const isReady = status === "ready";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="p-5 max-w-2xl mx-auto font-sans">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Chat</h2>

      <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] max-h-[400px] mb-4 bg-gray-50 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center mt-20">
            Start a conversation...
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="mb-3 leading-relaxed">
            <strong
              className={
                message.role === "user"
                  ? "text-blue-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
            >
              {message.role === "user" ? "You: " : "AI: "}
            </strong>
            {message.parts?.map((part, index) =>
              part.type === "text" ? (
                <span key={index}>{part.text}</span>
              ) : null,
            )}
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && isReady) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!isReady}
          placeholder="Say something..."
          className="flex-1 px-3 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!isReady || !input.trim()}
          className="px-5 py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isReady ? "Send" : "Loading..."}
        </button>
      </form>
    </div>
  );
}

export default App;
