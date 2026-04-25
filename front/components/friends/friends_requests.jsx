"use client";

import { useState, Fragment } from "react";
import { Chat as ChatContainer } from "@/components/chat/chat";
import {
  ChatHeader,
  ChatHeaderMain,
} from "@/components/chat/chat-header";
import FriendsRequestsList from "@/components/friends/friendsrequestslist.jsx";
import { Button } from "../../app/animations/Button.jsx";
// import FriendsRequests from "@/components/friends/friends_requests.jsx";

export default function FriendsRequests(props) {
  
  return (
    <div
      data-dialog-backdrop="web-3-dialog"
      data-dialog-backdrop-close="true"
      className="modal-overlay"
      onClick={(event) => {
        event.stopPropagation();
        props.setFriendsRequestsOpen(false);
      }}
    >
      <div
        data-dialog="web-3-dialog"
        className="px-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="w-[min(92vw,400px)] h-[min(88vh,600px)] z-50 shadow-xl rounded-3xl border-yellow border-20 table-fixed border-double overflow-hidden"
          style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
        >
          <ChatContainer className="h-full flex flex-col">
            <ChatHeader className="border-b bg-yellow">
              <ChatHeaderMain>
                <span className="font-medium"> Friends Requests </span>
              </ChatHeaderMain>
            </ChatHeader>
            <div className="flex-1 w-full h-0 bg-indigo p-0 overflow-y-auto">
              <div className="w-full h-full">
                <FriendsRequestsList  setFriendsRequestsOpen={props.setFriendsRequestsOpen}/>
              </div>
            </div>
            <div className="flex gap-3 justify-center py-3 bg-indigo">
              <Button statement="Go back" onClick={() => { props.setFriendsRequestsOpen(false) }} />
            </div>
          </ChatContainer>
        </div>
      </div>
    </div>
  );
}