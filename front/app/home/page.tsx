"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Background } from './Background';
import { Navbar } from './Navbar.jsx';
import { Button } from "../animations/Button.jsx"
import Chat from '../chat/chat';
import Online from "@/components/cards/Onlineplayers";
import SimpleFooter from "@/components/footers/footer";
import "./page.css";

export default function Home() {
  const [OptionsOpen, setOptionsOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Background />
      <Navbar OptionsOpen={OptionsOpen} setOptionsOpen={setOptionsOpen} />

  <div className="absolute inset-0 flex items-center justify-center gap-12">
  <div className="flex flex-row items-center gap-12">
    <div className="flex flex-col items-center gap-6">
      {/* <div className="tooltip party-title translate-y-10 translate-x-50" >Hey! Here's the rules: don't die. That's it!</div> */}
      <div className="w-[120px] h-[120px] sm:w-[200px] sm:h-[200px] md:w-[300px] md:h-[300px] lg:w-[400px] lg:h-[400px]">
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
    <div className="chat translate-x-185">
      <Online />
    </div>
  </div>
</div>
      <div className= "chat">
        <Chat />
      </div>
      <div className="absolute inset-x-4 bottom-3 h-16 ..."><SimpleFooter /></div>
    </main>
  );
}