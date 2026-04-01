"use client"
import { useState } from 'react';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {Background}  from "@/app/home/Background.jsx";
import { Button } from "../animations/Button.jsx"


export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
   return (
      <main className="relative min-h-screen flex items-center justify-center">
        <Background />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1 , y: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center justify-center gap-8 z-10">
            <div className="tooltip party-title mb-4 translate-x-50 translate-y-15">Hey! Here's the rules: don't die. That's it!</div>
            <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px]">
              <DotLottieReact
                id="navbar-avatar-animation"
                src="https://lottie.host/4a6712be-c728-4247-a609-65bd86fe8a84/JYUyKJJZH8.lottie"
                loop
                autoplay
              />
            </div>
            <Button statement="Let's play" />
          </div>
        </motion.div>
      </main>
    );
}
