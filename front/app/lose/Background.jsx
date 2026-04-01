"use client";
import "./Background.css";
import { motion } from "motion/react"
import { SparklesCore } from "@/components/ui/sparkles"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from "../animations/Button.jsx"
import { useRouter } from 'next/navigation';


export function Background() {
  const router = useRouter();

function handleClick(){
  router.push("/home")
}
  return (
    <div className="h-screen w-screen relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full absolute inset-0 h-full">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={1}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-20 flex flex-col items-center justify-center gap-6"
      >
        <div className="text-8xl md:text-9xl">
          💀
        </div>

        <h1 className="party-title text-6xl text-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-600">
            Tu as perdu!
          </span>
        </h1>

        <div className="mt-8">
          <Button statement= "Retour au lobby" onClick={handleClick}/>
        </div>
      </motion.div>
    </div>
  );
}