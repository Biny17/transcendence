"use client";

import { useEffect, useRef, useState, Fragment } from "react";
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

// type Message = {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
//   timestamp: Date;
// };

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
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/api/chat/ws");
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      console.log("WebSocket connected");
    });

    socket.addEventListener("message", (event) => {
      try {
        const receivedData = JSON.parse(event.data);
        // const content = receivedData?.content ?? String(event.data);
        setMessages((prev) => [
          ...prev,
         receivedData
        ]);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        console.log("Received data was:", event.data);
      }
    });

    socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
    });

    socket.addEventListener("close", () => {
      console.log("WebSocket closed");
    });

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return;
    }
    if (!input.trim()) return;

    // const userMessage = {
    //   id: crypto.randomUUID(),
    //   role: "user",
    //   content: input,
    //   timestamp: new Date(),
    // };

    socket.send(JSON.stringify({ conversation_id: 1, content: input }));
    // setMessages((prev) => [...prev, userMessage]);
    setInput("");
  };

  // Build enriched messages with sender info
  const enrichedMessages = messages.map((msg) => ({
    ...msg,
    sender: msg.role === "user" ? USER_SENDER : ASSISTANT_SENDER,
  }));

  return (
    <>
      {(
        <div
          className="fixed bottom-100 left-4 w-70 h-96.75 z-50 shadow-xl rounded-3xl border-yellow border-20 table-fixed border-double overflow-hidden xl:bottom-auto xl:top-1/2 xl:-translate-y-1/2"
          style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
        >
          <ChatContainer className="h-full">
            <ChatHeader className="border-b bg-yellow">
              <ChatHeaderAddon>
           
              </ChatHeaderAddon>
              <ChatHeaderMain >
                <span className="font-medium">Global Chat</span>
                {/* <span className="flex-1 grid">
                  <span className="text-sm font-medium truncate text-green-500">
                    {isLoading ? "En train d'écrire..." : "En ligne"}
                  </span>
                </span> */}
              </ChatHeaderMain>
              
            </ChatHeader>

            <ChatMessages className="scrollbar-hidden text-white bg-indigo" >
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

           <div className="flex items-center w-full bg-yellow px-2">
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
                className="flex-1 resize-none bg-yellow outline-none text-sm py-2"
                rows={1}
              />
              <ChatToolbarAddon align="inline-end">
               
                <ChatToolbarButton onClick={sendMessage} disabled={isLoading}>
                  <SquareChevronRightIcon />
                </ChatToolbarButton>
              </ChatToolbarAddon>
            </div>
          </ChatContainer>
        </div>
      )}
    </>
  );
}
