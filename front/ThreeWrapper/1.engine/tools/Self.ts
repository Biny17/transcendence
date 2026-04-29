"use client"
export class Self {
	id: string | null = null
	name: string | null = null
	isHost: boolean | null = null
	setId(id: string): void {
		this.id = id
	}
	setHost(host: boolean): void {
		this.isHost = host
	}
}
