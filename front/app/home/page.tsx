"use client"
import { useState } from 'react';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Background } from './Background';
import { Navbar } from './Navbar.jsx';
import { Button } from "../animations/Button.jsx"
import Chat from '../chat/chat';
import { ChartComponent } from "../../components/charts/chart"
import { EngineCanvas } from '@/ThreeWrapper/1.engine/EngineCanvas';
import { DemoWorld } from '@/ThreeWrapper/2.world/worlds/DemoWorld';
import ListCard from "@/components/cards/listcard";
import Online from "@/components/cards/Onlineplayers";

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
//   const testAPI = async () =>{
// const url = 'http://localhost:8080/hello';
// const options = {method: 'GET', headers: {Accept: 'application/json, application/problem+json'}};

//   try {
//     const response = await fetch(url, options);
//     const data = await response.json();
//     alert(data);
//   } catch (error) {
//     console.error(error);
//   }
// }
  return (
    
    <main className="relative min-h-screen">
      <Background />
      <Navbar signInOpen={signInOpen} setSignInOpen={setSignInOpen} />

  <div className="absolute inset-0 flex items-center justify-center gap-12">
  <div className="flex flex-row items-center gap-12">
    <div className="flex flex-col items-center gap-6">
      <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px]">
        <DotLottieReact
          src="https://lottie.host/4a6712be-c728-4247-a609-65bd86fe8a84/JYUyKJJZH8.lottie"
          loop
          autoplay
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: signInOpen ? 0 : 1, y: signInOpen ? 20 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Button statement="Let's play" />
      </motion.div>
    </div>
    <div>
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