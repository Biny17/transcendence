"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DemoWorld } from "@/ThreeWrapper/2.world/worlds/DemoWorld";
import { EngineCanvas } from "../../ThreeWrapper/1.engine/EngineCanvas";
import { ConnectingWorld } from "@/ThreeWrapper/2.world/worlds/ConnectingWorld";

export default function OnlineDemo() {
	const [engineReady, setEngineReady] = useState(false);

	return (
		<>
			<EngineCanvas
				config={{
					mode: "online",
					serverUrl: process.env.NEXT_PUBLIC_GAME_SERVER_URL || "wss://localhost/server/",
					debug: { enabled: true }
				}}
				world={() => new ConnectingWorld()}
				onReady={() => setEngineReady(true)}
				style={{ width: "100vw", height: "100vh" }}
			/>
		</>
	);
}
