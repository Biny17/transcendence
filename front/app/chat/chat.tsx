"use client";

import { useState, Fragment } from "react";
import {
  CalendarDaysIcon,
  GiftIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PhoneIcon,
  PlusIcon,
  SquareChevronRightIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { Chat as ChatContainer } from "@/components/chat/chat";
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderAvatar,
  ChatHeaderButton,
  ChatHeaderMain,
} from "@/components/chat/chat-header";
import {
  ChatToolbar,
  ChatToolbarAddon,
  ChatToolbarButton,
} from "@/components/chat/chat-toolbar";
import { ChatMessages } from "@/components/chat/chat-messages";
import { PrimaryMessage } from "@/components/examples/primary-message";
import { AdditionalMessage } from "@/components/examples/additional-message";
import { DateItem } from "@/components/examples/date-item";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const USER_SENDER = {
  id: "user",
  name: "Vous",
  username: "user",
  avatarUrl: "",
};

const ASSISTANT_SENDER = {
  id: "assistant",
  name: "Assistant IA",
  username: "assistant",
  avatarUrl: "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png",
};

export default function Chat() {
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {       // 👈 adapte l'URL à ta route
       method: "POST",
      headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
       }),
     });

     const data = await res.json();

     const assistantMessage: Message = {
       id: crypto.randomUUID(),
       role: "assistant",
       content: data.text ?? "",
       timestamp: new Date(),
     };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Groq error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Build enriched messages with sender info
  const enrichedMessages = messages.map((msg) => ({
    ...msg,
    sender: msg.role === "user" ? USER_SENDER : ASSISTANT_SENDER,
  }));

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 left-4 w-[360px] h-[520px] z-50 shadow-xl rounded-xl border overflow-hidden bg-white">
          <ChatContainer className="h-full">
            <ChatHeader className="border-b">
              <ChatHeaderAddon>
                <ChatHeaderAvatar
                  src="https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png"
                  alt="@assistant"
                  fallback="AI"
                />
              </ChatHeaderAddon>
              <ChatHeaderMain>
                <span className="font-medium">Assistant IA</span>
                <span className="flex-1 grid">
                  <span className="text-sm font-medium truncate text-green-500">
                    {isLoading ? "En train d'écrire..." : "En ligne"}
                  </span>
                </span>
              </ChatHeaderMain>
              <ChatHeaderAddon>
                <ChatHeaderButton className="@2xl/chat:inline-flex hidden">
                  <PhoneIcon />
                </ChatHeaderButton>
                <ChatHeaderButton className="@2xl/chat:inline-flex hidden">
                  <VideoIcon />
                </ChatHeaderButton>
                <ChatHeaderButton>
                  <MoreHorizontalIcon />
                </ChatHeaderButton>
                <ChatHeaderButton onClick={() => setIsOpen(false)}>
                  <XIcon />
                </ChatHeaderButton>
              </ChatHeaderAddon>
            </ChatHeader>

            <ChatMessages className="scrollbar-hidden">
              {enrichedMessages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-8">
                  Commencez la conversation !
                </p>
              )}

              {enrichedMessages.map((msg, i, msgs) => {
                const dateChanged =
                  new Date(msg.timestamp).toDateString() !==
                  new Date(msgs[i + 1]?.timestamp).toDateString();

                const nextSameSender = msg.sender.id === msgs[i + 1]?.sender.id;

                if (dateChanged) {
                  return (
                    <Fragment key={msg.id}>
                      <PrimaryMessage
                        avatarSrc={msg.sender.avatarUrl}
                        avatarAlt={msg.sender.username}
                        avatarFallback={msg.sender.name.slice(0, 2)}
                        senderName={msg.sender.name}
                        content={msg.content}
                        timestamp={msg.timestamp.getTime()}
                      />
                      <DateItem timestamp={msg.timestamp.getTime()} className="my-4" />
                    </Fragment>
                  );
                }

                if (nextSameSender) {
                  return (
                    <AdditionalMessage
                      key={msg.id}
                      content={msg.content}
                      timestamp={msg.timestamp.getTime()}
                    />
                  );
                }

                return (
                  <PrimaryMessage
                    className="mt-4"
                    key={msg.id}
                    avatarSrc={msg.sender.avatarUrl}
                    avatarAlt={msg.sender.username}
                    avatarFallback={msg.sender.name.slice(0, 2)}
                    senderName={msg.sender.name}
                    content={msg.content}
                    timestamp={msg.timestamp.getTime()}
                  />
                );
              })}

              {isLoading && (
                <div className="flex justify-start my-2 px-3">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-muted-foreground">
                    ...
                  </div>
                </div>
              )}
            </ChatMessages>

            <ChatToolbar>
              <ChatToolbarAddon align="inline-start">
                <ChatToolbarButton>
                  <PlusIcon />
                </ChatToolbarButton>
              </ChatToolbarAddon>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Écrire un message..."
                className="flex-1 resize-none bg-transparent outline-none text-sm py-2"
                rows={1}
              />
              <ChatToolbarAddon align="inline-end">
                <ChatToolbarButton>
                  <GiftIcon />
                </ChatToolbarButton>
                <ChatToolbarButton>
                  <CalendarDaysIcon />
                </ChatToolbarButton>
                <ChatToolbarButton onClick={sendMessage} disabled={isLoading}>
                  <SquareChevronRightIcon />
                </ChatToolbarButton>
              </ChatToolbarAddon>
            </ChatToolbar>
          </ChatContainer>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isOpen ? (
          <XIcon className="w-5 h-5" />
        ) : (
          <MessageCircleIcon className="w-5 h-5" />
        )}
      </button>
    </>
  );
}