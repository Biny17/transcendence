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
import ListCard from "@/components/cards/listcard";
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

export default function LeaderBoardCard() {
  
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
	  const res = await fetch("/api/chat", {
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
			{(
				<div
					className="leaderboard w-[300px] h-[400px] lg:w-[400px] lg:h-[600px] xl:w-[400px] xl:h-[600px] z-50 shadow-xl rounded-3xl border-yellow border-20 table-fixed border-double overflow-hidden"
					style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
				>
					<ChatContainer className="h-full flex flex-col">
						<div className="bg-yellow flex items-center justify-center pt-3 pb-1">
							<img
								src="champion.png"
								alt="Medaille du leaderboard"
								className="h-20 w-20 object-contain drop-shadow-md"
							/>
						</div>
						<ChatHeader className="border-b bg-yellow">
							<ChatHeaderMain >
								<span className="font-medium">LeaderBoard</span>
							</ChatHeaderMain>
						</ChatHeader>
						<div className="flex-1 w-full h-0 bg-indigo p-0 overflow-y-auto">
							<div className="w-full h-full">
								<ListCard />
							</div>
						</div>
					</ChatContainer>
				</div>
			)}
		</>
	);
}