import * as THREE from 'three'
import { SERVER_MSG } from 'shared/protocol'
import type { Module, WorldContext } from '../ModuleClass'
import { OBJECT_TYPE } from '@/ThreeWrapper/2.world/tools'
export class NetworkPlayerModule implements Module {
  readonly type = 'network-player'
  private ctx: WorldContext | null = null
  init(ctx: WorldContext): void {
    this.ctx = ctx
    for (const player of ctx.objects.getByType(OBJECT_TYPE.PLAYER)) {
      this.spawnPlayer(player.id)
    }
    ctx.server?.on(SERVER_MSG.PLAYER_JOIN, (p) => {
      ctx.objects.add({ id: p.id, type: OBJECT_TYPE.PLAYER, extraData: { serverData: p } })
      this.spawnPlayer(p.id)
    })
  }
  private spawnPlayer(playerId: string): void {
    if (!this.ctx) return
    const mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 1.8),
      new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff })
    )
    mesh.position.set(Math.random() * 10 - 5, 2, Math.random() * 10 - 5)
    this.ctx.objects.addPiece(playerId, {
      asset: mesh,
      relativePosition: { x: 0, y: 0, z: 0 },
      hitboxes: []
    })
  }
  private removePlayer(playerId: string): void {
    if (!this.ctx) return
    this.ctx.objects.remove(playerId)
  }
  update(_delta: number): void {}
  dispose(): void {
    this.ctx = null
  }
}
