"use client";

import { Button } from "@/app/animations/Button.jsx";
import { useState } from "react";

export function Terms({ setTermsOpen }) {
  const [Profile, setProfile] = useState()
 
  return (
    <div
      data-dialog-backdrop="web-3-dialog"
      data-dialog-backdrop-close="true"
      className="modal-overlay"
      onClick={() => setTermsOpen(false)}
    >
      <div
        className="relative m-4 h-130 max-w-5xl overflow-hidden rounded-3xl border-20 border-double border-yellow bg-[#0b1328] shadow-xl"
        style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
        data-dialog="web-3-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-white p-6 overflow-y-auto max-h-96">
          <h2 className="text-2xl font-bold mb-4">Terms of Service</h2>
          <section className="mb-4">
            <h3 className="font-semibold">1. Service Overview</h3>
            <p>This online video game is published by Fun Guys. It allows users to play, interact, and participate in virtual competitions.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">2. Access to the Service</h3>
            <p>Access to the game requires creating an account. Users must be at least 13 years old. They agree to provide accurate information and keep their credentials confidential.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">3. Code of Conduct</h3>
            <p>Cheating, harassing other players, hate speech, or undermining the integrity of the game are strictly prohibited. Any inappropriate behavior may result in sanctions.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">4. Intellectual Property</h3>
            <p>The game and all its content are protected by copyright. Any reproduction or modification without authorization is prohibited.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">5. Personal Data Protection</h3>
            <p>Data collected is used for the proper functioning of the game. In accordance with regulations, you have the right to access, rectify, and delete your data.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">6. Liability</h3>
            <p>The publisher cannot be held responsible for bugs, data loss, or temporary unavailability of the service.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">7. Sanctions</h3>
            <p>In case of non-compliance with the rules, the publisher reserves the right to suspend or delete the user's account.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">8. Changes to the Terms</h3>
            <p>The publisher may modify these terms at any time. Users will be informed of any changes.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">9. Contact</h3>
            <p>For any questions or complaints, please contact us at: [email/contact address].</p>
          </section>
        </div>
        <div className="mt-6 flex gap-3 justify-end pr-1">
          <Button statement="Go back" onClick={() => setTermsOpen(false)} />
        </div>
      </div>
    </div>
  );
}
