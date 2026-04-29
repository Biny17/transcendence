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
import MenuPrivacy from "@/components/cards/menu_privacy";

export default function Privacy({setPrivacyOpen}) {
  

  return (
  <>
	{(
	<div
	  className="w-70 h-100 lg:w-90 lg:h-100 xl:w-90 xl:h-110 z-50 shadow-xl rounded-3xl border-yellow border-20 table-fixed border-double overflow-hidden"
	  style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
	>
	  <ChatContainer className="h-full">
	  <ChatHeader className="border-b bg-yellow">
		<ChatHeaderMain >
		<span className="font-medium">Privacy Policy and Terms of Service</span>
		</ChatHeaderMain>
	  </ChatHeader>
		<MenuPrivacy setPrivacyOpen={setPrivacyOpen} />
		  </ChatContainer>
		</div>
	  )}
	</>
  );
}