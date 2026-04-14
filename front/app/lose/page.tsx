"use client"
import { useState } from 'react';
import { Background } from './Background';
import OrientationGuard  from '../home/Orientation_Guard.jsx';

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
  return (
    <>
    <OrientationGuard>
      <Background />
    </OrientationGuard>
    </>
  );
}
