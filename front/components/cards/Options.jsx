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
import MenuOptions from "@/components/cards/menu_options";

export default function Options({setOptionsOpen}) {
  

  return (
  <>
    {(
    <div
      className="w-90 h-130 z-50 shadow-xl rounded-3xl border-yellow border-20 table-fixed border-double overflow-hidden"
      style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
    >
      <ChatContainer className="h-full">
      <ChatHeader className="border-b bg-yellow">
        <ChatHeaderMain >
        <span className="font-medium">Options</span>
        </ChatHeaderMain>
      </ChatHeader>
        <MenuOptions setOptionsOpen={setOptionsOpen} />
		  </ChatContainer>
		</div>
	  )}
	</>
  );
}