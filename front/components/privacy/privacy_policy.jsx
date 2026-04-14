"use client";
import { Button } from "@/app/animations/Button.jsx";
import {useState } from "react";

export function PrivacyPolicy({ setPrivacyPolicyOpen }) {
  const [decoded, setDecoded] = useState("")

  
  return (
    <div
      data-dialog-backdrop="web-3-dialog"
      data-dialog-backdrop-close="true"
      className="modal-overlay"
      onClick={() => setPrivacyPolicyOpen(false)}
    >
      <div
        className="relative m-4 h-130 max-w-5xl overflow-hidden rounded-3xl border-20 border-double border-yellow bg-[#0b1328] shadow-xl"
        style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
        data-dialog="web-3-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b bg-yellow px-4 py-3">
         
        </div>
        <div className="mt-6 flex gap-3 justify-end pr-1">
            <Button statement="Go back" onClick={() => setPrivacyPolicyOpen(false)} />
        </div>
      </div>
    </div>
  );


}
