"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { ConversationDto, MessageDto } from "@skillbarter/shared";
import { MessageSquare, Send, User, AlertCircle } from "lucide-react";

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [messageError, setMessageError] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationsRequestId = useRef(0);

  const fetchConversations = async () => {
    const requestId = ++conversationsRequestId.current;
    try {
      const res = await api.messages.conversations();
      if (requestId !== conversationsRequestId.current) return;
      setConversations(res.conversations);
      const queryC = searchParams.get("c");
      if (queryC) {
        setActiveConvId(queryC);
      } else {
        setActiveConvId((currentId) => {
          if (currentId && res.conversations.some((conversation) => conversation.id === currentId)) {
            return currentId;
          }
          return res.conversations[0]?.id ?? null;
        });
      }
      setLoadError(false);
    } catch {
      if (requestId === conversationsRequestId.current) setLoadError(true);
    } finally {
      if (requestId === conversationsRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchConversations();
    return () => {
      conversationsRequestId.current += 1;
    };
  }, [searchParams]);

  useEffect(() => {
    let current = true;
    if (!activeConvId) {
      setMessages([]);
      setMessageError(false);
      return () => {
        current = false;
      };
    }

    setMessages([]);
    setMessageError(false);
    api.messages
      .getMessages(activeConvId)
      .then((res) => {
        if (current) {
          setMessages(res);
          setMessageError(false);
        }
      })
      .catch(() => {
        if (current) {
          setMessages([]);
          setMessageError(true);
        }
      });

    return () => {
      current = false;
    };
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !newMessage.trim() || sending) return;

    setSendError(null);
    setSending(true);
    try {
      const res = await api.messages.sendMessage(activeConvId, newMessage.trim());
      setMessages((prev) => [...prev, res.message]);
      setNewMessage("");
      fetchConversations();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading messages...</div>;
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherParticipant = activeConv?.participants.find((p) => p.id !== user?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {loadError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>Could not load your conversations. Please try again.</span>
          <button type="button" onClick={() => { setLoadError(false); setLoading(true); void fetchConversations(); }} className="rounded-lg bg-red-700 px-3 py-2 font-semibold text-white hover:bg-red-600">Retry</button>
        </div>
      )}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[calc(100vh-160px)] flex flex-col md:flex-row">
        {/* Left Side: Conversation List */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-red-700" />
              Conversations
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No conversations started yet.
              </div>
            ) : (
              conversations.map((c) => {
                const other = c.participants.find((p) => p.id !== user?.id);
                const isActive = c.id === activeConvId;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveConvId(c.id)}
                    className={`w-full text-left p-4 transition-all flex items-start gap-3 ${
                      isActive ? "bg-white shadow-sm border-l-4 border-red-700" : "hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700 text-xs">
                      {other?.displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {other?.displayName || "Participant"}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {c.lastMessage?.content || "Conversation created"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Thread */}
        <div className="flex-1 flex flex-col bg-white">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                    {otherParticipant?.displayName?.charAt(0).toUpperCase() || "P"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {otherParticipant?.displayName || "Peer"}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/30">
                {messageError ? (
                  <div role="alert" className="mx-auto max-w-sm rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-800">
                    <p>Messages could not be loaded.</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeConv) return;
                        setMessageError(false);
                        api.messages.getMessages(activeConv.id)
                          .then((res) => { setMessages(res); setMessageError(false); })
                          .catch(() => setMessageError(true));
                      }}
                      className="mt-3 rounded-lg border border-rose-300 px-3 py-2 font-semibold hover:bg-rose-100"
                    >
                      Retry messages
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No messages yet. Say hello and introduce your goals!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? "bg-red-700 text-white rounded-br-none"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              {sendError && (
                <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {sendError}
                </p>
              )}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-xs focus:border-red-700 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="rounded-xl bg-red-700 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="h-10 w-10 mb-2 text-slate-300" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
