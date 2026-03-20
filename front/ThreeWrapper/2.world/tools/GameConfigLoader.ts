import type { EventHandler } from '@/ThreeWrapper/1.engine/EventHandler'
import type { GameConfig } from '@/shared/types'
export class GameConfigLoader {
	private _config: GameConfig | null = null
	get config(): GameConfig | null {
		return this._config
	}
	async load(id: string, eventHandler: EventHandler): Promise<GameConfig> {
		const url = `/shared/gameconfig/${id}.yaml`
		const res = await fetch(url)
		if (!res.ok) throw new Error(`[GameConfigLoader] Failed to fetch config: ${url} (${res.status})`)
		const raw = await res.text()
		const config = await this.parseYaml(raw)
		this._config = config
		this.registerEvents(config, eventHandler)
		return config
	}
	private async parseYaml(raw: string): Promise<GameConfig> {
		try {
			const jsYaml = await import('js-yaml')
			return jsYaml.load(raw) as GameConfig
		} catch {
			return JSON.parse(raw) as GameConfig
		}
	}
	private registerEvents(config: GameConfig, eventHandler: EventHandler): void {
		const actionMap = new Map(config.actions.map((a) => [a.id, a]))
		for (const event of config.events) {
			eventHandler.on(event.name, (data) => {
				for (const actionId of event.actions) {
					const action = actionMap.get(actionId)
					if (!action) {
						console.warn(`[GameConfigLoader] Unknown action id: "${actionId}"`)
						continue
					}
					eventHandler.dispatchAction(action, data)
				}
			})
		}
	}
	dispose(): void {
		this._config = null
	}
}
