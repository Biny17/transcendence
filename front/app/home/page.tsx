"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Background } from './Background';
import { Navbar } from './Navbar.jsx';
import { Button } from "../animations/Button.jsx"
import Chat from '../chat/chat';
import Online from "@/components/cards/Onlineplayers";

export default function Home() {
  const [OptionsOpen, setOptionsOpen] = useState(false);
  const [rerenderKey, setRerenderKey] = useState(0);

  useEffect(() => {
    if (!OptionsOpen) 
      setRerenderKey(rerenderKey + 1);
  }, [OptionsOpen]);
  
  return (
    <main className="relative min-h-screen" key={rerenderKey}>
      <Background />
      <Navbar OptionsOpen={OptionsOpen} setOptionsOpen={setOptionsOpen} />

  <div className="absolute inset-0 flex items-center justify-center gap-12">
  <div className="flex flex-row items-center gap-12">
    <div className="flex flex-col items-center gap-6">
      <div className="tooltip party-title translate-y-10 translate-x-50" >Hey! Here's the rules: don't die. That's it!</div>
      <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px]">
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
    <div className="translate-x-185">
      <Online />
    </div>
  </div>
</div>
      <div className="fixed bottom-4 left-4 z-50 h-[55vh] max-h-128 w-80 max-w-[calc(100vw-2rem)]">
        <Chat />
      </div>
    </main>
  );
}