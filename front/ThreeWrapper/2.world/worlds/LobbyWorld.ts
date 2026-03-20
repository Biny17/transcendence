import * as THREE from 'three'
import { World } from '../WorldClass'
import { ResizeModule } from '@/ThreeWrapper/5.modules/rendering/ResizeModule'
import type { LobbyStatePayload, LobbyUpdatePayload } from '@/shared/protocol'
import { SERVER_MSG } from '@/shared/protocol'
import { DefaultEnvironment } from '@/ThreeWrapper/3.environments/envs/DefaultEnvironment'
export class LobbyWorld extends World {
	constructor() {
		super({ id: 'lobby' })
		this.applyEnvironment(new DefaultEnvironment())
	}
	protected override async onLoad(): Promise<void> {
		this.scene.background = new THREE.Color(0x1a1a2e)
		this.scene.add(new THREE.AmbientLight(0x4444ff, 0.6))
		const light = new THREE.PointLight(0x6688ff, 1.5, 50)
		light.position.set(0, 10, 0)
		this.scene.add(light)
		this.camera.position.set(0, 8, 15)
		this.camera.lookAt(0, 0, 0)
	}
	protected override onStart(): void {
		const nm = this.networkManager
		if (!nm) return
		nm.on<LobbyStatePayload>(SERVER_MSG.LOBBY_STATE, (payload) => {
			this.onLobbyState(payload)
		})
		nm.on<LobbyUpdatePayload>(SERVER_MSG.LOBBY_UPDATE, (payload) => {
			this.onLobbyUpdate(payload)
		})
	}
	private onLobbyState(_payload: LobbyStatePayload): void {
	}
	private onLobbyUpdate(_payload: LobbyUpdatePayload): void {
	}
}
