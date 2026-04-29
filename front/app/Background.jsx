"use client";
import "./Background.css";
import { Loader } from './animations/Loader';
import { NextRequest, NextResponse } from "next/server";
import { Spinner } from './animations/Spinner';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from "motion/react"
import { useRouter } from "next/navigation";
export function Background() {
  const router = useRouter();

  function getCookie(name) {
	 return document.cookie
	   .split('; ')
	   .find(row => row.startsWith(name + '='))
	   ?.split('=')[1];
   }
   const token = getCookie('auth_token');
  return (
	<>
    <div className="background">
	      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      <div className="blob blob-4"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative px-20 py-14 text-center mt-32">
      <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="party-title mb-6 text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-white"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
              Fun Guys
            </span>{" "}
            <span className="text-white">(For Sure)</span>

            <p className="mt-3 text-2xl font-semibold text-white lg:text-3xl">
              Here comes the Fun
            </p>
      </motion.h1>
          <div className="flex flex-col items-center gap-8">
            <div className="loader-shell flex flex-row items-center gap-6">
              <Loader/>
              {/* <Loader/> */}
            </div>
            <div className="spinner-shell">
              <Spinner onFinish={() => {token ? router.push("/home") : router.push("/login")}} />
            </div>
          </div>
		  
        </div>
      </div>
    </div>
	</>
  );
}
