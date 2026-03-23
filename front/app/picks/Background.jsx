"use client";
import "./Background.css";
import { motion } from "motion/react";
import { useState } from "react";
import { CharacterCard } from "./CharacterCard";
import {Button } from "../animations/Button.jsx"
const CHARACTER_IDS = Array.from({ length: 9 }, (_, i) => String(i + 1));

export function Background({ signInOpen }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      <div className="blob blob-4"></div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative px-8 py-4 text-center">
          
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="party-title mb-2 text-3xl text-heading md:text-5xl lg:text-6xl"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
              Choisissez votre Fun Guy
            </span>
          

          <p className="text-lg font-normal text-body lg:text-xl mb-8">
            Sélectionnez votre personnage pour cette partie
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {CHARACTER_IDS.map((id) => (
              <CharacterCard
                key={id}
                id={id}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
          </div>
</motion.h1>
          {selected && (
            // <button
            //   className="auth-button mt-6 w-full rounded-md py-2 px-4 border border-transparent text-center text-sm text-white transition-all"
            //   type="button"
            // >
            //   Confirmez votre choix
            // </button>
            <Button statement= "Confirmez votre choix" />
          )}

        </div>
      </div>
    </>
  );
}