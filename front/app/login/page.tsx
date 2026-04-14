"use client"
import { useState } from 'react';
import { Navbar } from './Navbar';
import { Background } from './Background';
import OrientationGuard  from '../home/Orientation_Guard.jsx';

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
  return (
    <>
    <OrientationGuard>
      <Background signInOpen={signInOpen} />
      <Navbar signInOpen={signInOpen} setSignInOpen={setSignInOpen} />
    </OrientationGuard>
    </>
  );
}
