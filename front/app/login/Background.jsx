"use client";
import "./Background.css";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from "motion/react"
import {Button } from "../animations/Button.jsx"
import { useEffect, useRef } from 'react';
import lottie from "lottie-web";
import Mascot from "@/public/mascot.json";
import MascotCartoon from "@/public/mascot-cartoon.json";
import Celeb from "@/public/celebrations.json";



export function Background({ signInOpen }) {

  const mascotRef = useRef(null);
  const mascotRef2 = useRef(null);
  const mascotCartoonRef = useRef(null);
  const mascotCartoonRef2 = useRef(null);
  const celebRef = useRef(null);

  useEffect(function () {
  const anim = lottie.loadAnimation({
    container: mascotRef.current,
    loop: true,
    autoplay: true,
    animationData: Mascot,
  });

  const anim2 = lottie.loadAnimation({
    container: mascotRef2.current,
    loop: true,
    autoplay: true,
    animationData: Mascot,
  });

  const anim3 = lottie.loadAnimation({
    container: mascotCartoonRef.current,
    loop: true,
    autoplay: true,
    animationData: MascotCartoon,
  });

  const anim4 = lottie.loadAnimation({
    container: mascotCartoonRef2.current,
    loop: true,
    autoplay: true,
    animationData: MascotCartoon,
  });

  const anim5 = lottie.loadAnimation({
    container: celebRef.current,
    loop: false,
    autoplay: true,
    animationData: Celeb,
  });

  return () => {
    anim.destroy();
    anim2.destroy();
    anim3.destroy();
    anim4.destroy();
    anim5.destroy();
  };
}, []);
 
    
  return (
	<>
    <div className="background">
		 <div ref={celebRef} className="absolute inset-0 z-10 pointer-events-none"/>
	      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      <div className="blob blob-4"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative px-20 py-14 text-center">
          <div className="dot1 absolute -top-1 -left-1 h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <div ref={mascotRef} />
          </div>
          <div className="dot2 absolute -top-1 -right-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <div ref={mascotCartoonRef} />
          </div>
          <div className="absolute -bottom-1 -left-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <div ref={mascotCartoonRef2} />
          </div>
          <div className="absolute -bottom-1 -right-1  h-15 w-15 md:h-32 md:w-32 lg:h-28 lg:w-28">
            <div ref={mascotRef2} />
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
