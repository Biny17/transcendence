"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Background } from './Background';
import { Navbar } from './Navbar.jsx';
import OrientationGuard  from './Orientation_Guard.jsx';
import { Button } from "../animations/Button.jsx"
import Chat from '../chat/chat';
import Online from "@/components/cards/Onlineplayers";
import SimpleFooter from "@/components/footers/footer";
import "./page.css";
import Privacy  from './Privacy.jsx';

export default function Home() {
  const [OptionsOpen, setOptionsOpen] = useState(false);
  const [PrivacyOpen, setPrivacyOpen] = useState(false);

  return (
    <OrientationGuard>
    <main className="relative min-h-screen">
      <Background />
      <Navbar OptionsOpen={OptionsOpen} setOptionsOpen={setOptionsOpen} />

  <div className="absolute inset-0 flex items-center justify-center gap-12">
  <div className="flex flex-row items-center gap-12">
    <div className="baloo_button fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6">

      <div className="w-[200px] h-[200px] sm:w-[200px] sm:h-[200px] md:w-[300px] md:h-[300px] lg:w-[300px] lg:h-[300px] xl:w-[500px] xl:h-[500px]" >
        <DotLottieReact
          id="navbar-avatar-animation"
          src="https://lottie.host/4a6712be-c728-4247-a609-65bd86fe8a84/JYUyKJJZH8.lottie"
          loop
          autoplay
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: OptionsOpen ? 0 : 1, y: OptionsOpen ? 20 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Button statement="Let's play" />
      </motion.div>
    </div>
    <div className="chat xl:fixed xl:right-2 xl:top-1/2 xl:-translate-y-1/2">
      <Online />
    </div>
  </div>
</div>
      <div className= "chat">
        <Chat />
      </div>
    <div className="absolute inset-x-4 bottom-5 h-14 ...">
        <SimpleFooter setPrivacyOpen={setPrivacyOpen}/>
      </div>
    {PrivacyOpen && (
        <div className="modal-overlay backdrop-blur-sm">
            <Privacy setPrivacyOpen={setPrivacyOpen}/>
        </div>
    )}
    </main>
    </OrientationGuard>
  );
}