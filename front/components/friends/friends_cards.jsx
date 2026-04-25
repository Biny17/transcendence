"use client";

import { useState, Fragment } from "react";
import { Chat as ChatContainer } from "@/components/chat/chat";
import {
  ChatHeader,
  ChatHeaderMain,
} from "@/components/chat/chat-header";
import FriendList from "@/components/friends/friends_list.jsx";
import { Button } from "../../app/animations/Button.jsx";
import FriendsRequests from "@/components/friends/friends_requests.jsx";

export default function YourFriends(props) {
  
const[FriendsDisplay, setFriendsDisplay] = useState(true);
const[FriendsRequestsOpen, setFriendsRequestsOpen] = useState(false);
  return (
    <div
      data-dialog-backdrop="web-3-dialog"
      data-dialog-backdrop-close="true"
      className="modal-overlay"
      onClick={(event) => {
        event.stopPropagation();
        props.setYourFriendsOpen(false);
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
                <span className="font-medium">{FriendsDisplay ? "Your Friends" : "Add Friends"}</span>
              </ChatHeaderMain>
            </ChatHeader>
            <div className="flex-1 w-full h-0 bg-indigo p-0 overflow-y-auto">
              <div className="w-full h-full">
                <FriendList FriendsDisplay={FriendsDisplay} FriendsRequestsOpen={FriendsRequestsOpen}/>
              </div>
            </div>
            <div className="flex gap-3 justify-center py-3 bg-indigo">
              {FriendsDisplay && (
                <Fragment>
                <Button statement="Add Friends" onClick={() => { setFriendsDisplay(false); }} />
                <Button statement="Friends Requests" onClick={() => { setFriendsRequestsOpen(true); }} />
                </Fragment>
              )}
              <Button statement="Go back" onClick={() => { FriendsDisplay ? props.setYourFriendsOpen(false) : setFriendsDisplay(true); }} />
            </div>
          </ChatContainer>
        </div>
      </div>
     {FriendsRequestsOpen && (
      <FriendsRequests setFriendsRequestsOpen={setFriendsRequestsOpen}/>
      )}
    </div>
  );
}