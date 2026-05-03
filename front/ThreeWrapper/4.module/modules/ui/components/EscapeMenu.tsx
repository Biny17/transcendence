'use client'

import { Button } from "../../../../../app/animations/Button.jsx"

type EscapeMenuProps = {
  onResume: () => void
  onKeybinds: () => void
  onReset?: () => void
}

export function EscapeMenu({ onResume, onKeybinds, onReset }: EscapeMenuProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05113a]/50">
      <div className="relative m-2 h-[60vh] w-[94vw] max-h-96 max-w-sm overflow-hidden rounded-3xl border-20 border-double border-yellow bg-[#0b1328] shadow-xl">
        <div className="flex items-center justify-between border-b bg-yellow px-4 py-3">
          <h5 className="text-lg font-medium text-[#292524]">Pause</h5>
        </div>
        <div className="flex h-[calc(100%-58px)] min-h-0 flex-col bg-[#05113a] px-4 py-5">
          <div className="min-h-0 flex-1 flex items-center justify-center overflow-y-auto scrollbar-hide pr-1">
            <div className="w-full max-w-xs flex flex-col gap-4 items-center">
              <div className="w-full flex justify-center">
                <Button statement="Reprendre" onClick={onResume} />
              </div>
              <div className="w-full flex justify-center">
                <Button statement="Keybinds" onClick={onKeybinds} />
              </div>
              {onReset && (
                <div className="w-full flex justify-center">
                  <Button statement="Reset" onClick={onReset} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
