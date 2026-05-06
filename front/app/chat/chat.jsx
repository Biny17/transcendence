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
import { api, API_BASE } from "@/lib/api";

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

export default function Chat(OptionsOpen) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ConversationId, setConversationId] = useState("");
  const [Img, setImg] = useState("");
  const socketRef = useRef(null);
  const [playerImgs, setPlayerImgs] = useState({});


async function fetchImg(id) {
  const url = `${API_BASE}/api/users/${id}/picture`;
  const options = {method: 'GET', credentials: 'include'};
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      return;
    }
    const blob = await response.blob();
    const imgUrl = URL.createObjectURL(blob);
    return (imgUrl);

  } catch (error) {
    console.error(error);
    setImg(null);
  }
}

useEffect(() => {
  async function loadImages() {
    const imgs = {};
    for (const message of messages) {
      const url = await fetchImg(message.sender.id);
      console.log(url)
      imgs[message.sender.id] = url;
    }
    setPlayerImgs(imgs);
  }
   if (messages.length > 0) {
    loadImages();
  }
  
}, [messages]);

  async function fetchConversationHistory(convId){
    try 
	  {
      const data = await api.get('/api/chat/conversation/' + convId + '/messages');
      setMessages(data)
      console.log(data)
    } 
    catch (error) 
    {
      console.log(error);
    }
  }

  async function definePlayerId(){
    try 
	  {
      const data = await api.get('/api/users/me');
      return(data[0].id)
    } 
    catch (error) 
    {
      console.log(error);
    }
  }

   useEffect(() => {
  
   async function initChat() {
    const convId = 1;
    const pId = await definePlayerId();
    fetchConversationHistory(1);

    const socket = new WebSocket(api.getChatWebSocketUrl("/api/chat/ws"));
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      console.log("WebSocket connected");
    });

    socket.addEventListener("message", (event) => {
      console.info("new message, update chat !");
      const payload = JSON.parse(event.data)
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === payload.id)) {
            return prev;
          }
          return [payload, ...prev];
        });
    });

    socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
    });

    socket.addEventListener("close", () => {
      console.log("WebSocket closed");
    });
  }
  initChat()
  fetchImg()
  }, []);

  const sendMessage = async () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return;
    }
    if (!input.trim()) return;
    socket.send(JSON.stringify({ conversation_id: 1, content: input }));
    setInput("");
  };

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
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-8">
                  Commencez la conversation !
                </p>
              )}
              {messages.map((msg, i) => {
                // const nextSameSender = msg.sender.id === msg[i + 1]?.sender.id;

                // if (dateChanged) {
                //   return (
                //     <Fragment key={msg.id}>
                //       <PrimaryMessage
                //         avatarSrc={msg.sender.avatarUrl}
                //         avatarAlt={msg.sender.username}
                //         avatarFallback={msg.sender.name.slice(0, 2)}
                //         senderName={msg.sender.name}
                //         content={msg.content}
                //         timestamp={msg.timestamp.getTime()}
                //       />
                //       <DateItem timestamp={msg.timestamp.getTime()} className="my-4" />
                //     </Fragment>
                //   );
                // }

                // if (nextSameSender) {
                //   return (
                //     <AdditionalMessage
                //       key={msg.id}
                //       content={msg.content}
                //       timestamp={msg.created_at}
                //     />
                //   );
                // }
                const senderName = msg.sender_username ?? msg.sender?.username ?? "Unknown";
                return (
                  
                  <PrimaryMessage
                    className="mt-4"
                    key={msg.id}
                    avatarSrc={msg.sender ? (playerImgs[msg.sender.id] || "/default-avatar.png") : "/default-avatar.png"}
                    avatarAlt={senderName}
                    // avatarFallback={msg.sender.username.slice(0, 2)}
                    senderName={senderName }
                    content={msg.content}
                    timestamp={msg.created_at}
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
                placeholder="Write a message..."
                className="scrollbar-hidden flex-1 resize-none bg-yellow outline-none text-sm py-2"
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
