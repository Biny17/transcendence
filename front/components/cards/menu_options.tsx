"use client";

import { Button } from "../../app/animations/Button.jsx";
import { useState } from 'react';
import { Profile } from "@/components/dialogs/profile";
import { Keyboard } from "@/components/dialogs/keyboard";

export default function MenuOptions() {
  const options = [
    "View profile",
    "Keyboard settings",
    "About us",
  ];
  const [profileOpen, setProfileOpen] = useState(false);
  const [KeyboardOpen, setKeyboardOpen] = useState(false);
   const [AboutusOpen, setAboutusOpen] = useState(false);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05113a]">
      <nav className="flex flex-col gap-4 overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]">
        {options.map((option, idx) => (
          <div key={idx} className="flex w-full items-center justify-center">
            <div className="w-full max-w-xs flex justify-center">
              {option === "View profile" && <Button statement={option} onClick={() => setProfileOpen(true)} />}
			  {option === "Keyboard settings" && <Button statement={option} onClick={() => setKeyboardOpen(true)} />}
			  {option === "About us" && <Button statement={option} onClick={() => setAboutusOpen(true)} />}
            </div>
          </div>
        ))}
    {profileOpen && (
      <Profile SetProfileOpen={setProfileOpen}/>
      )}
	{KeyboardOpen && (
      <Keyboard setKeyboardOpen={setKeyboardOpen}/>
      )}
	{AboutusOpen && (
      <Profile SetProfileOpen={setAboutusOpen}/>
      )}
      </nav>
    </div>
  );
}