"use client";
import "./Background.css";
import { motion } from "motion/react"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {Button } from "../animations/Button.jsx"
export function Background() {
  return (
    <div className="h-screen w-screen relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full absolute inset-0 h-full">
        <BackgroundGradientAnimation />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 z-30 pointer-events-none">
        <DotLottieReact
          src="https://lottie.host/1e6411ca-df14-4327-82a1-de9f5ebacc6b/rKObaLwEn8.lottie"
          autoplay
        />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-20 flex flex-col items-center justify-center gap-10"
      >
        <div className="text-8xl md:text-9xl">
          🏆
        </div>

        <h1 className="party-title text-5xl md:text-7xl lg:text-8xl text-center px-6 tracking-widest uppercase"
          style={{
            color: "#FFD700",
          }}
        >
          WINNER!
        </h1>

        <div className="flex items-center justify-center gap-10">
          <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
            <DotLottieReact src="https://lottie.host/625715ba-c990-472d-88c9-679feb7fa833/K7RlLzljd1.lottie" loop autoplay />
          </div>
          <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
            <DotLottieReact src="https://lottie.host/625715ba-c990-472d-88c9-679feb7fa833/K7RlLzljd1.lottie" loop autoplay />
          </div>
        </div>
		<Button statement= "Retour au lobby"/>
      </motion.div>
		  
    </div>
  );
}