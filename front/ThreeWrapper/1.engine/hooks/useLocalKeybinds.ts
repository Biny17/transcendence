import { useEffect } from "react";
import type { KeyBinding } from "shared/config";
import { DEFAULT_KEYBINDS } from "../tools/KeymapHandler";
const STORAGE_KEY = "game_keybindings";
export function useLocalKeybinds(onLoad?: (bindings: KeyBinding[]) => void) {
	const loadKeybindings = (): KeyBinding[] => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored) as KeyBinding[];
			}
		} catch (error) {
			console.error("[useLocalKeybinds] Failed to load from localStorage:", error);
		}
		return DEFAULT_KEYBINDS;
	};
	const saveKeybindings = (bindings: KeyBinding[]): void => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
		} catch (error) {
			console.error("[useLocalKeybinds] Failed to save to localStorage:", error);
		}
	};
	useEffect(() => {
		onLoad?.(loadKeybindings());
	}, [onLoad]);
	return { loadKeybindings, saveKeybindings };
}
