"use client";
import { DemoWorld } from "@/ThreeWrapper/2.world/worlds/DemoWorld";
import { EngineCanvas } from "../../ThreeWrapper/1.engine/EngineCanvas";
import { LobbyWorld } from "../../ThreeWrapper/2.world/worlds/LobbyWorld";
export default function OnlineDemo() {
	return (
		<EngineCanvas
			config={{
				mode: "online",
				serverUrl: "wss://ws.spacecowboy.fr/ws",
				debug: { enabled: true }
			}}
			world={() => new DemoWorld()}
			style={{ width: "100vw", height: "100vh" }}
		/>
	);
}
