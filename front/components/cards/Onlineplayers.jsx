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
// type Message = {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
//   timestamp: Date;
// };

// const USER_SENDER = {
//   id: "user",
//   name: "Vous",
//   username: "user",
//   avatarUrl: "",
// };

// const ASSISTANT_SENDER = {
//   id: "assistant",
//   name: "Assistant IA",
//   username: "assistant",
//   avatarUrl: "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png",
// };

export default function Online(OptionsOpen) {

  return (
	<>
	  {(
		<div
			className="w-70 h-96.75 z-50 shadow-xl rounded-3xl border-yellow border-20 table-fixed border-double overflow-hidden ml-12"
			style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
		>
		  <ChatContainer className="h-full">
			<ChatHeader className="border-b bg-yellow">
			  <ChatHeaderMain >
				<span className="font-medium">Online Players</span>
			  </ChatHeaderMain>
			</ChatHeader>
			<div className="flex-1 w-full h-full bg-indigo p-0">
				<div className="w-full h-full">
					<ListCard OptionsOpen={OptionsOpen}/>
				</div>
			</div>
		  </ChatContainer>
		</div>
	  )}
	</>
  );
}