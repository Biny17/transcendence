"use client"
import { useState } from 'react';
import { Background } from './Background';

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
  return (
    <>
      <Background />
    </>
  );
}
