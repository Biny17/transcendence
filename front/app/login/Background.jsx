"use client";
import "./Background.css";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from "motion/react"
import {Button } from "../animations/Button.jsx"
export function Background({ signInOpen }) {
  return (
	<>
    <div className="background">
		 <DotLottieReact
      src="/celebrations.json"
	  
      autoplay
    />
	      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      <div className="blob blob-4"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative px-20 py-14 text-center">
          <div className="dot1 absolute -top-1 -left-1 h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <DotLottieReact src="/mascot.json" loop autoplay />
          </div>
          <div className="dot2 absolute -top-1 -right-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <DotLottieReact src="/mascot-cartoon.json" loop autoplay />
          </div>
          <div className="absolute -bottom-1 -left-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <DotLottieReact src="/mascot-cartoon.json" loop autoplay />
          </div>
          <div className="absolute -bottom-1 -right-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <DotLottieReact src="/mascot.json" loop autoplay />
          </div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: signInOpen ? 0 : 1, scale: signInOpen ? 0.8 : 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="party-title mb-6 text-5xl md:text-7xl lg:text-6xl xl:text-8xl text-white"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
                Fun Guys
              </span>{" "}
              <span className="text-white">(For Sure)</span>

              <p className="mt-3 text-2xl font-semibold text-white lg:text-3xl">
                Here comes the Fun
              </p>
          </motion.h1>
           <Button statement= "Let's play"/>
        </div>
        
      </div>
    </div>
	</>
  );
}
