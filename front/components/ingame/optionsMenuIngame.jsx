"use client";

import { Button } from "../../app/animations/Button.jsx";
import { useState } from 'react';
import { Profile } from "@/components/dialogs/profile";
import { Keyboard } from "@/components/dialogs/keyboard";
import  LeaderBoard  from "@/components/cards/Leaderboard.jsx";
import  YourFriends  from "@/components/friends/friends_cards.jsx";
import { useRouter } from 'next/navigation';

export default function MenuOptions({setOptionsOpen}) {
  const options = [
    "Resume",
    "Keyboard settings",
    "LeaderBoard",
    "Quit Game",
  ];
  const [profileOpen, setProfileOpen] = useState(false);
  const [KeyboardOpen, setKeyboardOpen] = useState(false);
  const [LeaderBoardOpen, setLeaderBoardOpen] = useState(false);
  const [YourFriendsOpen, setYourFriendsOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05113a]">
      <nav className="flex flex-col gap-4 overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]">
        {options.map((option, idx) => (
          <div key={idx} className="flex w-full items-center justify-center">
            <div className="w-full max-w-xs flex justify-center">
        {option === "Resume" && <Button statement={option} onClick={() => setOptionsOpen(false)} />}
		{option === "Keyboard settings" && <Button statement={option} onClick={() => setKeyboardOpen(true)} />}
        {option === "LeaderBoard" && <Button statement={option} onClick={() => setLeaderBoardOpen(true)} />}
        {option === "Quit Game" && <Button statement={option} onClick={() => router.push("/home")} />}
            </div>
          </div>
        ))}
	{KeyboardOpen && (
      <Keyboard setKeyboardOpen={setKeyboardOpen}/>
      )}
  {LeaderBoardOpen && (
      <LeaderBoard setLeaderBoardOpen={setLeaderBoardOpen}/>
      )}
      </nav>
    </div>
  );
}