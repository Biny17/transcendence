"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DemoWorld } from "@/ThreeWrapper/2.world/worlds/DemoWorld";
import { EngineCanvas } from "../../ThreeWrapper/1.engine/EngineCanvas";
import { ConnectingWorld } from "@/ThreeWrapper/2.world/worlds/ConnectingWorld";

export default function OnlineDemo() {
  const [engineReady, setEngineReady] = useState(false);

  return (
    <>
      <EngineCanvas
        config={{
          mode: "online",
          serverUrl: process.env.GAME_SERVER_URL ?? "ws://localhost:3002",
          debug: { enabled: true }
        }}
        world={() => new ConnectingWorld()}
        onReady={() => setEngineReady(true)}
        style={{ width: "100vw", height: "100vh" }}
      />
      <AnimatePresence>
        {!engineReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10,
              background: "#060816",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "3px solid rgba(255,255,255,0.1)",
                  borderTopColor: "#06b6d4",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                Loading...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}