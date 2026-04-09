"use client"
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {Background}  from "@/app/home/Background.jsx";
import { Button } from "../animations/Button.jsx"
// import "./comicbookbubble.css";
import "./comicspeechbubbles.css";
import TextType from "@/components/effects/Texttype";

export default function Home() {
   return (
      <main className="relative min-h-screen flex items-center justify-center">
        <Background />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1 , y: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center  justify-center gap-8 z-10">
            <div className="w-full max-w-4xl px-4 translate-x-130 translate-y-30">
              <div className="bubble left text-5xl">
                <TextType 
                  text={["Hello! Rules are simple for this one!", "Don't die! That's it! Don't die! Easy..."]}
                  typingSpeed={100}
                  pauseDuration={2800}
                  showCursor
                  cursorCharacter="_"
                  deletingSpeed={0}
                  variableSpeedEnabled={false}
                  variableSpeedMin={60}
                  variableSpeedMax={120}
                  cursorBlinkDuration={0.5}
                />
              </div>
            </div>
            <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px]">
        
              <DotLottieReact
                id="navbar-avatar-animation"
                src="https://lottie.host/4a6712be-c728-4247-a609-65bd86fe8a84/JYUyKJJZH8.lottie"
                loop
                autoplay
              />
            </div>
            {/* <Button statement="Let's play" /> */}
          </div>
        </motion.div>
      </main>
    );
}
