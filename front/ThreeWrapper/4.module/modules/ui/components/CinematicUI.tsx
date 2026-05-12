'use client'
import { motion } from 'framer-motion'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import TextType from '@/components/effects/Texttype'

type Props = {
  description: string
}

export function CinematicUI({ description }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 'clamp(2rem, 8vh, 6rem)',
        pointerEvents: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ position: 'relative' }}
      >
        <div
          style={{
            display: 'inline-block',
            position: 'relative',
            padding: 'clamp(0.75rem, 2vw, 2rem)',
            borderRadius: '10px',
            border: '3px solid black',
            background: 'white',
            fontFamily: 'var(--font-party-title), var(--font-geist-sans), sans-serif',
            maxWidth: 'min(600px, 80vw)',
            fontSize: 'clamp(0.875rem, 2.5vw, 1.5rem)',
          }}
        >
          <TextType
            text={[description]}
            typingSpeed={100}
            pauseDuration={2800}
            showCursor
            cursorCharacter="_"
            deletingSpeed={0}
            variableSpeedEnabled={false}
            variableSpeedMin={60}
            variableSpeedMax={120}
            cursorBlinkDuration={0.5}
            variableSpeed={undefined}
            onSentenceComplete={undefined}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '24px solid black',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '13px solid transparent',
            borderRight: '13px solid transparent',
            borderTop: '20px solid white',
          }}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        style={{
          width: 'clamp(150px, 35vw, 450px)',
          height: 'clamp(150px, 35vw, 450px)',
          marginTop: '-0.5rem',
        }}
      >
        <DotLottieReact
          id="navbar-avatar-animation"
          src="/cute-bear.json"
          loop
          autoplay
        />
      </motion.div>
    </div>
  )
}
