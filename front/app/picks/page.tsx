"use client"
import { useState } from 'react';
import { Navbar } from './Navbar';
import { Background } from './Background';

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
  return (
    <div className="relative h-screen overflow-hidden">
      <Background signInOpen={signInOpen} />
      <Navbar signInOpen={signInOpen} setSignInOpen={setSignInOpen} />
    </div>
  );
}
