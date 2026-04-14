"use client";

import { Button } from "../../app/animations/Button.jsx";
import { useState } from 'react';
import { PrivacyPolicy } from "@/components/privacy/privacy_policy.jsx";
import { Terms } from "@/components/privacy/terms.jsx";

export default function MenuPrivacy({setPrivacyOpen}) {
  const options = [
    "Privacy Policy",
    "Terms of service",
    "Go back",
  ];
  const [PrivacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [TermsOpen, setTermsOpen] = useState(false);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05113a]">
      <nav className="flex flex-col gap-4 overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]">
        {options.map((option, idx) => (
          <div key={idx} className="flex w-full items-center justify-center">
            <div className="w-full max-w-xs flex justify-center">
              {option === "Privacy Policy" && <Button statement={option} onClick={() => setPrivacyPolicyOpen(true)} />}
			  {option === "Terms of service" && <Button statement={option} onClick={() => setTermsOpen(true)} />}
        	  {option === "Go back" && <Button statement={option} onClick={() => setPrivacyOpen(false)} />}
            </div>
          </div>
        ))}
    {PrivacyPolicyOpen && (
      <PrivacyPolicy setPrivacyPolicyOpen={setPrivacyPolicyOpen}/>
      )}
	{TermsOpen && (
      <Terms setTermsOpen={setTermsOpen}/>
      )}
      </nav>
    </div>
  );
}