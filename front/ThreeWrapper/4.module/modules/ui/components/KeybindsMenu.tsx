'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../../../app/animations/Button.jsx'
import Key from '../../../../../components/keyboard/key.jsx'
import Space from '../../../../../components/keyboard/space.jsx'
import type { KeyBinding } from 'shared/config'

type KeybindsMenuProps = {
  getBindings: () => KeyBinding[]
  onRebind: (action: string, key: string) => void
  onClose: () => void
}

const ACTION_LABELS: Record<string, string> = {
  forward: 'Forward',
  backward: 'Backward',
  left: 'Left',
  right: 'Right',
  space: 'Space',
  shift: 'Shift',
  pause: 'Pause',
  detach: 'Detach',
}

function codeToLabel(code: string | undefined): string {
  if (!code) return '—'
  if (code.startsWith('Key')) return code.slice(3).toUpperCase()
  if (code.startsWith('Digit')) return code.slice(5)
  if (code === 'Space') return 'Space'
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift'
  return code
}

export function KeybindsMenu({ getBindings, onRebind, onClose }: KeybindsMenuProps) {
  const [listening, setListening] = useState<string | null>(null)
  const [bindings, setBindings] = useState<KeyBinding[]>(getBindings())

  useEffect(() => {
    setBindings(getBindings())
  }, [getBindings])

  function startListening(action: string) {
    setListening(action)
  }

  useEffect(() => {
    if (!listening) return

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      const newBindings = bindings.map(b =>
        b.action === listening ? { ...b, key: event.code } : b
      )
      setBindings(newBindings)
      setListening(null)
      onRebind(listening, event.code)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [listening, bindings, onRebind])

  const handleClose = useCallback(() => {
    try {
      localStorage.setItem('game_keybindings', JSON.stringify(bindings))
    } catch (error) {
      console.error('[KeybindsMenu] Failed to save to localStorage:', error)
    }
    onClose()
  }, [bindings, onClose])

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-[#05113a]/80"
    >
      <div className="relative m-2 h-[88vh] w-[94vw] max-h-208 max-w-4xl overflow-hidden rounded-3xl border-20 border-double border-yellow bg-[#0b1328] shadow-xl sm:h-[86vh] sm:w-[88vw] md:m-4 md:h-[84vh] md:w-[80vw] lg:h-[82vh] lg:w-[70vw] xl:h-[80vh] xl:w-[60vw]">
        <div className="flex items-center justify-between border-b bg-yellow px-4 py-3">
          <h5 className="text-lg font-medium text-[#292524]">Keyboard Settings</h5>
          <button onClick={handleClose} className="text-[#292524] hover:text-[#1a1a1a] text-xl font-bold">✕</button>
        </div>
        <div className="flex h-[calc(100%-58px)] min-h-0 flex-col bg-[#05113a] px-4 py-5">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scrollbar-hide pr-1">
            <div className="mb-8">
              <p className="text-sm font-light text-slate-300">
                Click on a key, then press a keyboard key to rebind it.
              </p>
            </div>
            {bindings.map((b) => {
              const isListening = listening === b.action
              const label = ACTION_LABELS[b.action] || b.action
              const keyName = isListening ? '…' : codeToLabel(b.key)

              if (b.action === 'space' || b.action === 'shift') {
                return (
                  <fieldset key={b.action} className="flex items-center gap-4">
                    <label className="w-24 text-right text-[15px] text-slate-200">{label}</label>
                    <Space
                      name={keyName}
                      onClick={() => !isListening && startListening(b.action)}
                    />
                  </fieldset>
                )
              }

              return (
                <fieldset key={b.action} className="flex items-center gap-4">
                  <label className="w-24 text-right text-[15px] text-slate-200">{label}</label>
                  <Key
                    name={keyName}
                    onClick={() => !isListening && startListening(b.action)}
                  />
                </fieldset>
              )
            })}
          </div>
          <div className="mt-6 flex shrink-0 gap-3 justify-end pr-1">
            <Button statement="Go back" onClick={handleClose} />
            <Button statement="Save Changes" onClick={handleClose} />
          </div>
        </div>
      </div>
    </div>
  )
}
