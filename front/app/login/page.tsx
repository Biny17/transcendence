"use client"
import { useState } from 'react';
import { Navbar } from './Navbar';
import { Background } from './Background';

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
  return (
    <>
      <Background signInOpen={signInOpen} />
      <Navbar signInOpen={signInOpen} setSignInOpen={setSignInOpen} />
    </>
  );
}
