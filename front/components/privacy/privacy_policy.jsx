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
        <div className="text-white p-6 overflow-y-auto scrollbar-hide max-h-96">
          <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
          <section className="mb-4">
            <h3 className="font-semibold">1. Introduction</h3>
            <p>We, FunGuysCorp, are committed to protecting your personal data. This Privacy Policy explains what data we collect when you use FunGuys, how we use it, and what rights you have regarding your information.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">2. Data we collect</h3>
            <ul className="list-disc">Depending on the features you use, we may collect the following data:
              <li className="ml-10">Account data: username, email address, encrypted password</li>
              <li className="ml-10">Game data: progress, scores, statistics, unlocked achievements, playtime</li>
              <li className="ml-10">Technical data: device type, operating system, game version, session identifier, IP address</li>
              <li className="ml-10">Communication data: in-game chat messages, bug reports, support requests</li>
            </ul>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">3. How we use your data</h3>
            <ul className="list-disc">Your data is used to:
              <li className="ml-10">Enable leaderboards and multiplayer features</li>
              <li className="ml-10">Prevent cheating, abuse, and fraudulent activity</li>
              <li className="ml-10">Perform anonymized statistical analysis to improve gameplay and performance</li>
            </ul>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">4. Data sharing</h3>
            <ul className="list-disc">We do not sell your personal data. It may be shared with:
              <li className="ml-10">Our technical service providers (hosting, analytics, anti-cheat systems)</li>
              <li className="ml-10">Law enforcement or regulatory authorities when required by applicable law</li>
            </ul>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">5. Cookies and similar technologies</h3>
            <p>The website and launcher associated with the game may use cookies to maintain your session, remember your preferences, and measure audience traffic.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">6. Data retention</h3>
            <p>Account data is retained for as long as your account is active, then deleted within [30/90] days of your deletion request. Anonymized game statistics may be retained indefinitely for analytical purposes.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">7. Your rights (GDPR)</h3>
            <ul className="list-disc">If you reside in the European Economic Area, you have the following rights:
              <li className="ml-10">Right to access, correct, and delete your personal data</li>
              <li className="ml-10">Right to object to processing and to data portability</li>
              <li className="ml-10">Right to withdraw consent at any time</li>
              <li className="ml-10">Right to lodge a complaint with your local data protection authority (e.g. CNIL in France, ICO in the UK)</li>
              <p>To exercise any of these rights, contact us at: funguys@gmail.com</p>
            </ul>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">8. Data security</h3>
            <p>We implement appropriate technical and organizational measures (encryption, access controls, regular audits) to protect your data against unauthorized access, loss, or disclosure. However, no system is entirely immune to risk, and we cannot guarantee absolute security.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">9. Changes to this policy</h3>
            <p>We may update this Privacy Policy from time to time. In the event of significant changes, you will be notified by email or through an in-game notice. The date of the latest update is always shown at the top of this page.</p>
          </section>
          <section className="mb-4">
            <h3 className="font-semibold">10.  Contact</h3>
            <p>You may contact us at funguys@gmail.com</p>
          </section>
        </div>
        <div className="mt-6 flex gap-3 justify-end pr-1">
            <Button statement="Go back" onClick={() => setPrivacyPolicyOpen(false)} />
        </div>
      </div>
    </div>
  );


}
