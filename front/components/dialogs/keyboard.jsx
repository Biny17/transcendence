"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/animations/Button.jsx";
import Key from "@/components/keyboard/key.jsx";
import Space from "@/components/keyboard/space.jsx";

const STORAGE_KEY = "transequipe.keybindings";
const DEFAULT_BINDINGS = {
  forward: "KeyW",
  backward: "KeyS",
  left: "KeyA",
  right: "KeyD",
  space: "Space",
  shift: "ShiftLeft",
};

function codeToLabel(code) {
  if (!code) return "?";
  if (code.startsWith("Key")) return code.slice(3).toUpperCase();
  if (code.startsWith("Digit")) return code.slice(5);
  if (code === "Space") return "Space";
  if (code === "ShiftLeft" || code === "ShiftRight") return "Shift";
  return code;
}

export function Keyboard({ setKeyboardOpen }) {
  const [bindings, setBindings] = useState(DEFAULT_BINDINGS);
  const [listeningAction, setListeningAction] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      setBindings((prev) => ({ ...prev, ...saved }));
    } catch {

    }
  }, []);

  useEffect(() => {
    if (!listeningAction) return;

    const onKeyDown = (event) => {
      event.preventDefault();
      setBindings((prev) => ({ ...prev, [listeningAction]: event.code }));
      setListeningAction(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [listeningAction]);

  const saveAndClose = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
    setKeyboardOpen(false);
  };

  return (
    <div
      data-dialog-backdrop="web-3-dialog"
      data-dialog-backdrop-close="true"
      className="modal-overlay"
      onClick={() => setKeyboardOpen(false)}
    >
      <div
        className="relative m-2 h-[84vh] w-[88vw] max-h-208 max-w-4xl overflow-hidden rounded-3xl border-20 border-double border-yellow bg-[#0b1328] shadow-xl md:m-4"
        style={{ fontFamily: "var(--font-party-title), var(--font-geist-sans), sans-serif" }}
        data-dialog="web-3-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b bg-yellow px-4 py-3">
          <h5 className="text-lg font-medium text-[#292524]">Keyboard Settings</h5>
        </div>
        <div className="flex h-[calc(100%-58px)] flex-col justify-between bg-[#05113a] px-4 py-5">
          <div className="space-y-4">
            <div className="mb-8">
              <p className="text-sm font-light text-slate-300">
                Click on a key, then press a keyboard key to rebind it.
              </p>
            </div>
            <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="username">
                Forward
              </label>
              <Key
                name={listeningAction === "forward" ? "..." : codeToLabel(bindings.forward)}
                onClick={() => setListeningAction("forward")}
              />
            </fieldset>

            <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="name">
                Backward
              </label>
              <Key
                name={listeningAction === "backward" ? "..." : codeToLabel(bindings.backward)}
                onClick={() => setListeningAction("backward")}
              />
            </fieldset>

            <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="email">
                Left
              </label>
              <Key
                name={listeningAction === "left" ? "..." : codeToLabel(bindings.left)}
                onClick={() => setListeningAction("left")}
              />
            </fieldset>
			 <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="email">
                Right
              </label>
              <Key
                name={listeningAction === "right" ? "..." : codeToLabel(bindings.right)}
                onClick={() => setListeningAction("right")}
              />
            </fieldset>
			 <fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="email">
                Space
              </label>
              <Space
                name={listeningAction === "space" ? "..." : codeToLabel(bindings.space)}
                onClick={() => setListeningAction("space")}
              />
            </fieldset>
			<fieldset className="flex items-center gap-4">
              <label className="w-24 text-right text-[15px] text-slate-200" htmlFor="email">
                Shift
              </label>
              <Space
                name={listeningAction === "shift" ? "..." : codeToLabel(bindings.shift)}
                onClick={() => setListeningAction("shift")}
              />
            </fieldset>
          </div>

          <div className="mt-6 flex justify-end pr-1">
            <Button statement="Save Changes" onClick={saveAndClose} />
          </div>
        </div>
      </div>
    </div>
  );
}
