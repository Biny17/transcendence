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
  const [ConversationId, setConversationId] = useState("");
  // let id = 0;
  const socketRef = useRef(null);

  async function findConversationId(){

  const url = 'http://localhost:8080/api/chat/conversation';

    const options = {method: 'POST', credentials: 'include', headers: {'Accept': 'application/json, application/problem+json', 'Content-Type': 'application/json'}, body: '{"target_user_id":2}'};
    try 
	  {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) 
      {
        const err = await response.json();
        throw new Error(err.title);
      }
      if (response.status === 200)
      {
        setConversationId(data.conversation_id)
        return(data.conversation_id)
      }
    } 
    catch (error) 
    {
      console.log(error);
    }
  }

  async function fetchConversationHistory(convId){
    const url = 'http://localhost:8080/api/chat/conversation/' + convId + '/messages';
    //const options = {method: 'GET', headers: {Accept: 'application/json, application/problem+json'}};
    const options = {method: 'GET', credentials: 'include', headers: {'Accept': 'application/json, application/problem+json', 'Content-Type': 'application/json'}};
    try 
	  {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) 
      {
        const err = await response.json();
        throw new Error(err.title);
      }
      if (response.status === 200)
      {
        //console.log(data)
        setMessages(data)
      }
    } 
    catch (error) 
    {
      console.log(error);
    }
  }

  
  useEffect(() => {
  
   async function init() {
    const convId = await findConversationId();
    console.log(convId)
    fetchConversationHistory(convId);

    const socket = new WebSocket("ws://localhost:8080/api/chat/ws");
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      console.log("WebSocket connected");
    });

    socket.addEventListener("message", () => {
      console.info("new message, update chat !");
      fetchConversationHistory(convId);
    });

    socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
    });

    socket.addEventListener("close", () => {
      console.log("WebSocket closed");
    });
  }
  init()
  }, []);

  const sendMessage = async () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return;
    }
    if (!input.trim()) return;
    socket.send(JSON.stringify({ conversation_id: ConversationId, content: input }));
    fetchConversationHistory(ConversationId);
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

                return (
                  <PrimaryMessage
                    className="mt-4"
                    key={msg.id}
                    // avatarSrc={msg.sender.avatarUrl}
                    // avatarAlt={msg.sender.username}
                    // avatarFallback={msg.sender.username.slice(0, 2)}
                    senderName={msg.sender.username}
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
