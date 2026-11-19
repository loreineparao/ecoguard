"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  classifyEnvironmentalConcern,
  type GeminiResult,
} from "@/app/actions/gemini";
import {
  deleteChatConversation,
  getChatHistory,
  saveChatMessagePair,
  type PersistedConversation,
} from "@/app/actions/chat-history";
import {
  ArrowLeft,
  Bot,
  Clock,
  History,
  LoaderCircle,
  MessageSquare,
  MessageSquarePlus,
  Minus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type ClassificationResult = {
  module: "complaint" | "permit" | "unknown";
  classification: "illegal_dumping" | "tree_cutting" | "unknown";
  message: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at?: string;
};

const welcomeMessage =
  "Hello! I am your EcoGuard Assistant for the Municipality of Mabini. I can help guide you to the right environmental service in Filipino or English, such as reporting illegal dumping, applying for tree-cutting permits, checking complaint status, and garbage collection schedules.";

const suggestions = [
  "Pano mag submit ng complaint?",
  "How do I apply for a tree cutting permit?",
  "Saan ko makikita ang status ng complaint ko?",
  "Kailan ang garbage collection schedule?",
];

function createWelcomeMessage(): ChatMessage {
  return {
    id: "welcome-msg",
    role: "assistant",
    content: welcomeMessage,
  };
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function renderFormattedMessage(content: string): ReactNode {
  // Regex to match markdown links: [link text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | { text: string; url: string })[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIdx) {
      parts.push(content.substring(lastIdx, match.index));
    }
    parts.push({ text: match[1], url: match[2] });
    lastIdx = linkRegex.lastIndex;
  }
  if (lastIdx < content.length) {
    parts.push(content.substring(lastIdx));
  }

  return parts.map((part, pIdx) => {
    if (typeof part === "object") {
      return (
        <Link
          key={`link-${pIdx}`}
          href={part.url}
          className="chat-action-link"
        >
          {part.text}
        </Link>
      );
    }

    // Split text by **bold**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((sub, sIdx) => {
      if (sub.startsWith("**") && sub.endsWith("**") && sub.length > 4) {
        return <strong key={`b-${pIdx}-${sIdx}`}>{sub.slice(2, -2)}</strong>;
      }
      return sub;
    });
  });
}

export default function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<PersistedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isSendingRef = useRef(false);
  const idCounterRef = useRef(0);
  const currentRequestIdRef = useRef(0);

  // Scroll to bottom when messages change in chat view
  useEffect(() => {
    if (open && view === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, view, loading]);

  // Load persistent conversation history from Supabase on mount
  useEffect(() => {
    let active = true;

    async function loadPersistedHistory() {
      setHistoryLoading(true);
      try {
        const res = await getChatHistory();
        if (!active) return;

        if (res.success && res.userId) {
          const uid = res.userId;
          setUserId(uid);

          let loadedList = res.conversations;
          const storageKey = `ecoguard_chat_cache_${uid}`;
          const activeKey = `ecoguard_chat_active_${uid}`;

          // Merge with local cache if local cache has any unsynced items
          try {
            const rawLocal = localStorage.getItem(storageKey);
            if (rawLocal) {
              const parsedLocal = JSON.parse(rawLocal) as PersistedConversation[];
              if (Array.isArray(parsedLocal) && loadedList.length === 0 && parsedLocal.length > 0) {
                loadedList = parsedLocal;
              }
            }
            localStorage.setItem(storageKey, JSON.stringify(loadedList));
          } catch {
            // Ignore storage errors
          }

          setConversations(loadedList);

          // Restore active conversation after browser refresh or page navigation
          let preferredActiveId: string | null = null;
          try {
            preferredActiveId = localStorage.getItem(activeKey);
          } catch {
            preferredActiveId = null;
          }

          if (preferredActiveId === "__new__") {
            setActiveConversationId(null);
            setMessages([createWelcomeMessage()]);
          } else {
            const targetConv =
              (preferredActiveId
                ? loadedList.find((c) => c.id === preferredActiveId)
                : null) ?? loadedList[0];

            if (targetConv && targetConv.messages.length > 0) {
              setActiveConversationId(targetConv.id);
              setMessages([
                createWelcomeMessage(),
                ...targetConv.messages.map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  created_at: m.created_at,
                })),
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        if (active) {
          setHistoryLoading(false);
        }
      }
    }

    void loadPersistedHistory();
    return () => {
      active = false;
    };
  }, []);

  function syncLocalCache(
    uid: string | null,
    nextConversations: PersistedConversation[],
    nextActiveId: string | null | "__new__"
  ) {
    if (!uid) return;
    try {
      localStorage.setItem(
        `ecoguard_chat_cache_${uid}`,
        JSON.stringify(nextConversations)
      );
      if (nextActiveId !== undefined) {
        if (nextActiveId === null) {
          localStorage.removeItem(`ecoguard_chat_active_${uid}`);
        } else {
          localStorage.setItem(`ecoguard_chat_active_${uid}`, nextActiveId);
        }
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  function handleStartNewChat() {
    setActiveConversationId(null);
    setMessages([createWelcomeMessage()]);
    setConfirmDeleteId(null);
    setView("chat");
    syncLocalCache(userId, conversations, "__new__");
  }

  function handleSelectConversation(conv: PersistedConversation) {
    setActiveConversationId(conv.id);
    setMessages([
      createWelcomeMessage(),
      ...conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
    ]);
    setConfirmDeleteId(null);
    setView("chat");
    syncLocalCache(userId, conversations, conv.id);
  }

  async function handleConfirmDelete(conversationId: string) {
    setDeletingId(conversationId);
    try {
      await deleteChatConversation(conversationId);
      const nextList = conversations.filter((c) => c.id !== conversationId);
      setConversations(nextList);
      setConfirmDeleteId(null);

      if (activeConversationId === conversationId) {
        const nextActive = nextList[0] ?? null;
        if (nextActive) {
          setActiveConversationId(nextActive.id);
          setMessages([
            createWelcomeMessage(),
            ...nextActive.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              created_at: m.created_at,
            })),
          ]);
          syncLocalCache(userId, nextList, nextActive.id);
        } else {
          setActiveConversationId(null);
          setMessages([createWelcomeMessage()]);
          syncLocalCache(userId, nextList, "__new__");
        }
      } else {
        syncLocalCache(userId, nextList, activeConversationId);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function sendMessage(messageText: string) {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || loading || isSendingRef.current) return;
    isSendingRef.current = true;

    currentRequestIdRef.current += 1;
    const requestId = currentRequestIdRef.current;

    idCounterRef.current += 1;
    const tempUserId = `user-${idCounterRef.current}`;
    idCounterRef.current += 1;
    const tempAssistantId = `assistant-${idCounterRef.current}`;
    setInput("");
    setView("chat");

    setMessages((current) => [
      ...current,
      { id: tempUserId, role: "user", content: trimmedMessage },
    ]);
    setLoading(true);

    try {
      const recentHistory = messages
        .filter((m) => m.id !== "welcome-msg")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await classifyEnvironmentalConcern(trimmedMessage, recentHistory);

      // If a newer request has already started, discard this outdated result
      if (requestId !== currentRequestIdRef.current) {
        return;
      }

      let assistantReply: string;

      if (!response.success || !response.result) {
        assistantReply =
          "Maaari kang mag-ulat ng illegal dumping sa [Submit Complaint](/complaints/new) o mag-apply para sa [Tree Cutting Permit](/permits/new) sa ating EcoGuard portal.";
      } else {
        assistantReply =
          response.result.message ??
          "Matutulungan kita sa pag-file ng illegal dumping complaints at tree cutting permits sa Bayan ng Mabini.";
      }

      // Add the assistant response and immediately dismiss the thinking indicator
      setMessages((current) => [
        ...current,
        {
          id: tempAssistantId,
          role: "assistant",
          content: assistantReply,
        },
      ]);
      setLoading(false);
      isSendingRef.current = false;

      // Persist conversation & messages to Supabase asynchronously in background
      try {
        const saveResult = await saveChatMessagePair({
          conversationId: activeConversationId,
          userMessage: trimmedMessage,
          assistantMessage: assistantReply,
        });

        if (
          requestId === currentRequestIdRef.current &&
          saveResult.success &&
          saveResult.conversation
        ) {
          const savedConv = saveResult.conversation;
          setActiveConversationId(savedConv.id);
          setMessages([
            createWelcomeMessage(),
            ...savedConv.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              created_at: m.created_at,
            })),
          ]);

          setConversations((prev) => {
            const nextList = [
              savedConv,
              ...prev.filter((c) => c.id !== savedConv.id),
            ];
            syncLocalCache(userId, nextList, savedConv.id);
            return nextList;
          });
        }
      } catch (saveErr) {
        console.warn("Failed to persist chat message pair:", saveErr);
      }
    } catch (err) {
      console.error("Error communicating with EcoGuard AI:", err);
      if (requestId === currentRequestIdRef.current) {
        setMessages((current) => [
          ...current,
          {
            id: tempAssistantId,
            role: "assistant",
            content:
              "Paumanhin, nagkaroon ng pansamantalang aberya sa sistema. Maaari mong direktang i-file ang iyong report sa 'Submit Complaint' o 'Tree Cutting Permit' sa menu.",
          },
        ]);
        setLoading(false);
        isSendingRef.current = false;
      }
    } finally {
      if (requestId === currentRequestIdRef.current) {
        setLoading(false);
        isSendingRef.current = false;
      }
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="floating-ai">
      {open && (
        <section
          className="floating-ai-window"
          aria-label="EcoGuard AI Assistant"
        >
          <header className="floating-ai-header">
            <div className="floating-ai-title">
              <span className="floating-ai-avatar">
                <Bot size={17} aria-hidden="true" />
              </span>
              <div>
                <strong>EcoGuard AI Assistant</strong>
                <small>MENR Guidance • Mabini</small>
              </div>
            </div>
            <div className="floating-ai-header-actions">
              <button
                className="floating-ai-close"
                type="button"
                onClick={handleStartNewChat}
                title="New Chat"
                aria-label="New Chat"
              >
                <MessageSquarePlus size={16} aria-hidden="true" />
              </button>
              <button
                className={`floating-ai-close ${view === "history" ? "active" : ""}`}
                type="button"
                onClick={() =>
                  setView((current) =>
                    current === "history" ? "chat" : "history"
                  )
                }
                title={view === "history" ? "Back to Chat" : "Chat History"}
                aria-label={view === "history" ? "Back to Chat" : "Chat History"}
              >
                <History size={16} aria-hidden="true" />
              </button>
              <button
                className="floating-ai-close"
                type="button"
                onClick={() => setOpen(false)}
                title="Minimize assistant"
                aria-label="Minimize assistant"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <button
                className="floating-ai-close"
                type="button"
                onClick={() => setOpen(false)}
                title="Close assistant"
                aria-label="Close assistant"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </header>

          {view === "history" ? (
            <div className="floating-ai-history" aria-label="Conversation History">
              <div className="floating-ai-history-topbar">
                <button
                  type="button"
                  className="floating-ai-back-btn"
                  onClick={() => setView("chat")}
                  aria-label="Back to active conversation"
                >
                  <ArrowLeft size={13} aria-hidden="true" />
                  <span>Back to Chat</span>
                </button>
                <span className="floating-ai-history-header-count">
                  {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
                </span>
              </div>
              {historyLoading ? (
                <div className="floating-ai-history-empty">
                  <LoaderCircle className="spin" size={20} aria-hidden="true" />
                  <p>Loading conversation history...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="floating-ai-history-empty">
                  <History size={24} aria-hidden="true" />
                  <strong>No conversations yet</strong>
                  <p>
                    Your questions and EcoGuard AI guidance will be saved here automatically.
                  </p>
                  <button
                    type="button"
                    className="button green"
                    style={{ padding: "7px 14px", fontSize: "12px", marginTop: "6px" }}
                    onClick={handleStartNewChat}
                  >
                    Start a Conversation
                  </button>
                </div>
              ) : (
                <ul className="floating-ai-history-list">
                  {conversations.map((conv) => {
                    const isCurrent = conv.id === activeConversationId;
                    const isConfirming = confirmDeleteId === conv.id;
                    const isDeleting = deletingId === conv.id;

                    return (
                      <li
                        key={conv.id}
                        className={`floating-ai-history-item ${isCurrent ? "current" : ""
                          }`}
                      >
                        <button
                          type="button"
                          className="floating-ai-history-select"
                          onClick={() => handleSelectConversation(conv)}
                        >
                          <div className="floating-ai-history-item-top">
                            <strong>{conv.title}</strong>
                            {isCurrent && (
                              <span className="floating-ai-active-tag">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="floating-ai-history-meta">
                            <Clock size={11} aria-hidden="true" />
                            {formatTimestamp(conv.updated_at)} ·{" "}
                            {conv.messages.length}{" "}
                            {conv.messages.length === 1 ? "msg" : "msgs"}
                          </span>
                        </button>

                        {isConfirming ? (
                          <div className="floating-ai-delete-confirm">
                            <span>Delete this chat?</span>
                            <div>
                              <button
                                type="button"
                                className="confirm-yes"
                                disabled={isDeleting}
                                onClick={() => void handleConfirmDelete(conv.id)}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                              <button
                                type="button"
                                className="confirm-no"
                                disabled={isDeleting}
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="floating-ai-history-delete"
                            onClick={() => setConfirmDeleteId(conv.id)}
                            title="Delete conversation"
                            aria-label={`Delete conversation ${conv.title}`}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <>
              <div className="floating-ai-messages" aria-live="polite">
                {messages.map((message) => (
                  <div
                    className={`floating-ai-message ${message.role}`}
                    key={message.id}
                  >
                    {message.role === "assistant" && (
                      <span className="floating-ai-message-icon">
                        <Bot size={13} aria-hidden="true" />
                      </span>
                    )}
                    <p>{renderFormattedMessage(message.content)}</p>
                  </div>
                ))}
                {loading && (
                  <div className="floating-ai-message assistant" role="status">
                    <span className="floating-ai-message-icon">
                      <Bot size={13} aria-hidden="true" />
                    </span>
                    <p className="floating-ai-thinking">
                      <LoaderCircle
                        className="spin"
                        size={13}
                        aria-hidden="true"
                      />
                      Thinking...
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="floating-ai-suggestions">
                <span className="floating-ai-suggestions-label">
                  <Sparkles size={12} aria-hidden="true" /> Suggested guidance
                </span>
                <div className="min-w-0 w-full overflow-x-auto overflow-y-hidden">
                  <div className="flex w-max min-w-full flex-nowrap gap-2 pb-2">
                    {suggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        onClick={() => void sendMessage(suggestion)}
                        disabled={loading}
                        className="whitespace-nowrap shrink-0"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form className="floating-ai-form" onSubmit={handleSubmit}>
                <label className="sr-only" htmlFor="floating-ai-input">
                  Ask EcoGuard AI Assistant
                </label>
                <input
                  id="floating-ai-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask an environmental question..."
                  disabled={loading}
                  autoComplete="off"
                />
                <button
                  className="floating-ai-send"
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                >
                  {loading ? (
                    <LoaderCircle
                      className="spin"
                      size={15}
                      aria-hidden="true"
                    />
                  ) : (
                    <Send size={15} aria-hidden="true" />
                  )}
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <button
        className={`floating-ai-trigger ${open ? "open" : ""}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={
          open ? "Close EcoGuard AI Assistant" : "Open EcoGuard AI Assistant"
        }
        aria-expanded={open}
        title="EcoGuard AI Assistant"
      >
        {open ? (
          <X size={20} aria-hidden="true" />
        ) : (
          <MessageSquare size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
