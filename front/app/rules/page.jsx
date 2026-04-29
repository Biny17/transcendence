"use client"
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {Background}  from "@/app/home/Background.jsx";
import { Button } from "../animations/Button.jsx"
import "./comicspeechbubbles.css";
import TextType from "@/components/effects/Texttype";

export default function Home() {
   return (
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <Background />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1 , y: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center justify-center gap-4 z-10">
				<div className="bubble left text-xs sm:text-3xl md:text-xl lg:text-2xl px-2 sm:px-4 md:px-8 py-2 sm:py-4 mx-auto max-w-[100px] sm:max-w-md md:max-w-lg lg:max-w-3xl">
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
            
				<div className="w-[120px] h-[120px] sm:w-[200px] sm:h-[200px] md:w-[300px] md:h-[300px] lg:w-[400px] lg:h-[400px]">
			
				<DotLottieReact
					id="navbar-avatar-animation"
					src="/cute-bear.json"
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
