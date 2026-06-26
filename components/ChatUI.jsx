import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../src/api/chatApi.js";

function extractTitle(messages) {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Chat";
  const text = firstUser.parts?.find((p) => p.type === "text")?.text || "";
  return text.length > 50 ? text.slice(0, 50) + "..." : text || "New Chat";
}

/* ---------- Transport (stable reference) ---------- */
const transport = new DefaultChatTransport({
  api: "http://localhost:3000/chat",
});

/* ---------- Chat Session ---------- */
function ChatSession({ conversationId, onTitleUpdate }) {
  const { messages, sendMessage, status, error, reload, setMessages } = useChat(
    {
      transport,
    },
  );

  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const isLoading = status === "submitted" || status === "streaming";
  const isReady = !isLoading;

  const skipNextSave = useRef(false);

  /* ---- Load messages from MongoDB on mount / tab switch ---- */
  useEffect(() => {
    let cancelled = false;
    getConversation(conversationId)
      .then((conv) => {
        if (!cancelled) {
          skipNextSave.current = true;
          setMessages(conv.messages || []);
          setLoaded(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load messages:", err);
          skipNextSave.current = true;
          setMessages([]);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, setMessages]);

  /* ---- Keep a ref to latest messages for unmount save ---- */
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* ---- Save on unmount (safety net for tab switches) ---- */
  useEffect(() => {
    return () => {
      if (messagesRef.current.length > 0) {
        updateConversation(conversationId, {
          messages: messagesRef.current,
        }).catch((err) =>
          console.error("Failed to save messages on unmount:", err),
        );
      }
    };
  }, [conversationId]);

  /* ---- Persist messages + title on every change (skip the DB load) ---- */
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (messages.length === 0) return;
    const title = extractTitle(messages);
    onTitleUpdate?.(conversationId, title);
    updateConversation(conversationId, { messages }).catch((err) =>
      console.error("Failed to save messages:", err),
    );
  }, [messages, conversationId, onTitleUpdate]);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const h = Math.min(
        textareaRef.current.scrollHeight,
        window.innerHeight * 0.3,
      );
      textareaRef.current.style.height = `${h}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (isReady) inputRef.current?.focus();
  }, [isReady]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && isReady) {
      sendMessage({ text: input });
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = [
    "Explain quantum computing in simple terms",
    "Got any creative ideas for a 10 year old's birthday?",
    "How do I make an HTTP request in JavaScript?",
    "What are the differences between Python and JavaScript?",
  ];

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-[#10a37f] rounded-full" />
      </div>
    );
  }

  return (
    <>
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

      {error && (
        <div className="px-4 md:px-6 pt-2">
          <div className="max-w-3xl mx-auto p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>
              Something went wrong:{" "}
              {error.message || "Failed to get a response"}
            </span>
            <button
              onClick={() => reload()}
              className="ml-4 px-3 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 py-5 bg-white border-t border-gray-300 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
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
    </>
  );
}

/* ---------- Main Chat UI ---------- */
function ChatUI() {
  const [conversations, setConversations] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [moveMenuOpen, setMoveMenuOpen] = useState(null);

  // Load conversations and folders on mount (no message state here)
  useEffect(() => {
    async function init() {
      try {
        const [convData, folderData] = await Promise.all([
          getConversations(),
          getFolders(),
        ]);
        setFolders(folderData);
        setConversations(convData);
        if (convData.length > 0) {
          setActiveId(convData[0].id);
        } else {
          const newConv = await createConversation();
          setConversations([newConv]);
          setActiveId(newConv.id);
        }
      } catch (err) {
        console.error("Failed to initialize:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Close move menu when clicking outside
  useEffect(() => {
    if (!moveMenuOpen) return;
    const handleClick = () => setMoveMenuOpen(null);
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moveMenuOpen]);

  const handleNewChat = async () => {
    try {
      const conv = await createConversation("New Chat");
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setSidebarOpen(false);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleNewFolder = async () => {
    try {
      const folder = await createFolder("New Folder");
      setFolders((prev) => [folder, ...prev]);
      setExpandedFolders((prev) => new Set(prev).add(folder.id));
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleRenameFolder = async (id, name) => {
    if (!name.trim()) return;
    try {
      await updateFolder(id, name.trim());
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: name.trim() } : f)),
      );
    } catch (err) {
      console.error("Failed to rename folder:", err);
    } finally {
      setRenamingFolder(null);
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!confirm("Delete this folder? Conversations will be uncategorized."))
      return;
    try {
      await deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      setConversations((prev) =>
        prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c)),
      );
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  };

  const handleMoveConversation = async (convId, folderId) => {
    try {
      await updateConversation(convId, { folderId: folderId || null });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, folderId: folderId || null } : c,
        ),
      );
      setMoveMenuOpen(null);
    } catch (err) {
      console.error("Failed to move conversation:", err);
    }
  };

  const handleTitleUpdate = useCallback((id, title) => {
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === id);
      if (!conv || conv.title === title) return prev;
      updateConversation(id, { title }).catch((err) =>
        console.error("Failed to update title:", err),
      );
      return prev.map((c) => (c.id === id ? { ...c, title } : c));
    });
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteConversation(id);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (activeId === id) {
        if (updated.length > 0) {
          setActiveId(updated[0].id);
        } else {
          const newConv = await createConversation();
          setConversations([newConv]);
          setActiveId(newConv.id);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const uncategorizedConversations = conversations.filter((c) => !c.folderId);

  const renderConversationItem = (conv) => (
    <div key={conv.id} className="flex items-center gap-1 group">
      <button
        onClick={() => {
          setActiveId(conv.id);
          setSidebarOpen(false);
        }}
        className={`flex-1 p-3 rounded-lg text-left text-sm flex items-center gap-2 truncate transition-all ${
          conv.id === activeId
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
        <span className="truncate">{conv.title}</span>
      </button>

      {/* Move menu toggle */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMoveMenuOpen(moveMenuOpen === conv.id ? null : conv.id);
          }}
          className="p-2 rounded-md text-gray-400 hover:text-[#10a37f] hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          title="Move to folder"
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
              d="M5 12h.01M12 12h.01M19 12h.01"
            />
          </svg>
        </button>
        {moveMenuOpen === conv.id && (
          <div
            className="absolute right-0 top-8 z-50 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleMoveConversation(conv.id, null)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                !conv.folderId
                  ? "text-[#10a37f] font-medium"
                  : "text-gray-700"
              }`}
            >
              Uncategorized
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => handleMoveConversation(conv.id, f.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  conv.folderId === f.id
                    ? "text-[#10a37f] font-medium"
                    : "text-gray-700"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={(e) => handleDelete(conv.id, e)}
        className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        title="Delete conversation"
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );

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

      <aside
        className={`fixed md:relative left-0 top-0 z-[100] w-[260px] h-screen bg-white border-r border-gray-300 flex flex-col p-4 overflow-y-auto transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
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

        <button
          onClick={handleNewChat}
          className="w-full px-4 py-3 mb-2 bg-white border border-gray-300 rounded-lg cursor-pointer text-sm text-[#0d0d0d] font-medium flex items-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all"
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

        <button
          onClick={handleNewFolder}
          className="w-full px-4 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer text-sm text-gray-600 font-medium flex items-center gap-2 hover:bg-gray-100 hover:border-gray-300 transition-all"
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
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
            />
          </svg>
          New Folder
        </button>

        <div className="flex-1 overflow-y-auto space-y-1 sidebar-scroll">
          {/* Folders */}
          {folders.map((folder) => {
            const folderConversations = conversations.filter(
              (c) => c.folderId === folder.id,
            );
            const isExpanded = expandedFolders.has(folder.id);
            return (
              <div key={folder.id} className="mb-2">
                <div className="flex items-center gap-1 group">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex-1 flex items-center gap-2 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all text-left"
                  >
                    <svg
                      className={`w-3 h-3 shrink-0 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <svg
                      className="w-4 h-4 shrink-0 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    {renamingFolder === folder.id ? (
                      <input
                        autoFocus
                        defaultValue={folder.name}
                        onBlur={(e) =>
                          handleRenameFolder(folder.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleRenameFolder(folder.id, e.target.value);
                          if (e.key === "Escape") setRenamingFolder(null);
                        }}
                        className="flex-1 text-sm bg-white border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-[#10a37f]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate font-medium">
                        {folder.name}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingFolder(folder.id);
                    }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-[#10a37f] hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Rename folder"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete folder"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                {isExpanded && (
                  <div className="ml-5 mt-1 space-y-1">
                    {folderConversations.length === 0 && (
                      <div className="text-xs text-gray-400 px-3 py-1">
                        No chats
                      </div>
                    )}
                    {folderConversations.map(renderConversationItem)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized */}
          {uncategorizedConversations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="px-2 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Uncategorized
              </div>
              {uncategorizedConversations.map(renderConversationItem)}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-400 text-center">AI Assistant</div>
        </div>
      </aside>

      <div
        className={`fixed inset-0 bg-black/50 z-[99] transition-opacity md:hidden ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen bg-white min-w-0">
        <header className="px-4 md:px-6 py-4 border-b border-gray-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#0d0d0d]">
              AI Assistant
            </h1>
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

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-[#10a37f] rounded-full" />
          </div>
        )}

        {!loading && activeId && (
          <ChatSession
            key={activeId}
            conversationId={activeId}
            onTitleUpdate={handleTitleUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default ChatUI;
