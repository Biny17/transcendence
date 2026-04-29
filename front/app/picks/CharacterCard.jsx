"use client";
import { motion } from "motion/react";

const FLOAT_ANIMATION = { x: 10, y: -10 };

const FLOAT_TRANSITION = {
  duration: 2,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
};

const CHECK_STYLE = {
  position: "absolute",
  top: 4,
  right: 4,
  background: "#22c55e",
  borderRadius: "50%",
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.7rem",
  color: "white",
  fontWeight: "bold",
  zIndex: 10,    
};

export function CharacterCard({ id, selected, onSelect }) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.8 }}
      className={`card-vignette card-v${id} w-full aspect-[2/1] rounded-lg overflow-hidden`}
    >
      <button className="w-full h-full" onClick={() => onSelect(id)}>
        <motion.div
          className="w-full h-full"
          animate={FLOAT_ANIMATION}
          transition={FLOAT_TRANSITION}
        >
          <img
            src="/among-us(1).svg"
            className="w-full h-full object-contain"
            alt={`Personnage ${id}`}
          />
        </motion.div>
      </button>

      {selected === id && <div style={CHECK_STYLE}>✓</div>}
    </motion.div>
  );
}