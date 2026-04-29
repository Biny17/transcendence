"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import "./DebugPanel.css";
import { ConsoleWindow } from "./ConsoleWindow";
import { LoggingSection } from "./LoggingSection";
import { WorldInspectorSection } from "./WorldInspectorSection";
import { VisualDebugSection } from "./VisualDebugSection";
import { NetworkingSection } from "./NetworkingSection";
import { EngineControlsSection } from "./EngineControlsSection";
import { StatsOverlay } from "./StatsOverlay";
import { Logger } from "../../../../1.engine/tools/Logger";
import type { PieceHitbox } from "../../../../2.world/tools/ObjectManager";
export interface DebugControl {
	open: () => void;
	close: () => void;
	toggle: () => void;
	setObjectPosition: (id: string, pos: { x: number; y: number; z: number }) => void;
	setObjectRotation: (id: string, rot: { x: number; y: number; z: number; w: number }) => void;
	setObjectExtra: (id: string, key: string, value: unknown) => void;
	setObjectVelocity: (id: string, vel: { x: number; y: number; z: number }) => void;
	pinObject: (id: string) => void;
	getObjectById: (id: string) => ManagedObjectData | null;
	getAllObjects: () => ObjectSummary[];
	removeObject: (id: string) => void;
	teleportToObject: (id: string) => void;
	teleportObjectToPlayer: (id: string) => void;
	cloneObject: (id: string) => void;
	freezeObject: (id: string, freeze: boolean) => void;
	addPiece: (id: string, piece: { assetName?: string; relativePosition: { x: number; y: number; z: number }; hitboxes?: PieceHitbox[] }) => void;
	removePiece: (id: string, pieceIndex: number) => void;
	setPieceRelativePosition: (id: string, pieceIndex: number, relPos: { x: number; y: number; z: number }) => void;
	setPieceHitbox: (id: string, pieceIndex: number, hitboxIndex: number, hitbox: { shape: PieceHitbox["shape"]; relativeOffset: PieceHitbox["relativeOffset"]; collidesWith?: PieceHitbox["collidesWith"]; isSensor?: PieceHitbox["isSensor"]; tag?: PieceHitbox["tag"] }) => void;
	setGravityScale: (scale: number) => void;
	setSubStepping: (steps: number) => void;
	setGodMode: (enabled: boolean) => void;
	setNoclip: (enabled: boolean) => void;
	setInfiniteResources: (enabled: boolean) => void;
	quickSave: () => { success: boolean; message: string };
	quickLoad: () => { success: boolean; message: string };
	getSnapshotList: () => string[];
	saveWorldSnapshot: (name: string) => { success: boolean; message: string };
	loadWorldSnapshot: (name: string) => { success: boolean; message: string };
	getCameraPosition: () => { x: number; y: number; z: number };
	getAvailableObjectTypes: () => string[];
	spawnObject: (type: string, position: { x: number; y: number; z: number }, componentUrl?: string) => Promise<string | null>;
	getSelfPlayerId: () => string | null;
}
export interface ManagedObjectData {
	id: string;
	name?: string;
	type: string;
	componentId: string;
	position: { x: number; y: number; z: number };
	rotation: { x: number; y: number; z: number; w?: number };
	velocity?: { x: number; y: number; z: number };
	isGrounded?: boolean;
	extraData: Record<string, unknown>;
	pieces: Array<{
		asset: { position: { x: number; y: number; z: number } };
		relativePosition: { x: number; y: number; z: number };
		hitboxes: unknown[];
	}>;
}
export interface ObjectSummary {
	id: string;
	name?: string;
	type: string;
	position: { x: number; y: number; z: number };
	active: boolean;
}
export interface DebugSection {
	id: string;
	label: string;
	controls: DebugControlDef[];
}
export interface DebugControlDef {
	type: "checkbox" | "slider" | "number" | "text" | "select";
	key: string;
	label: string;
	value: boolean | number | string;
	options?: { min?: number; max?: number; step?: number; items?: string[] };
	onChange?: (value: boolean | number | string) => void;
}
const SECTIONS: DebugSection[] = [
	{
		id: "world",
		label: "World",
		controls: [
			{ type: "checkbox", key: "paused", label: "Paused", value: false },
			{ type: "slider", key: "timeScale", label: "Time Scale", value: 1, options: { min: 0, max: 2, step: 0.1 } },
			{ type: "slider", key: "gravity", label: "Gravity", value: 9.8, options: { min: 0, max: 30, step: 0.1 } }
		]
	},
	{
		id: "visual",
		label: "Visual",
		controls: [
			{ type: "checkbox", key: "wireframe", label: "Wireframe", value: false },
			{ type: "checkbox", key: "grid", label: "Grid", value: false },
			{ type: "checkbox", key: "shadows", label: "Shadows", value: true },
			{ type: "checkbox", key: "fog", label: "Fog", value: true },
			{ type: "slider", key: "ambient", label: "Ambient", value: 0.5, options: { min: 0, max: 1, step: 0.05 } }
		]
	},
	{
		id: "object",
		label: "Object",
		controls: []
	},
	{
		id: "engine",
		label: "Engine",
		controls: [
			{ type: "checkbox", key: "fps", label: "Show FPS", value: false },
			{ type: "checkbox", key: "drawCalls", label: "Draw Calls", value: false },
			{ type: "checkbox", key: "triangles", label: "Triangles", value: false },
			{ type: "checkbox", key: "memory", label: "Memory", value: false }
		]
	}
];
export type EngineState = {
	frameCount: number;
	paused: boolean;
	timeScale: number;
	gravity: number;
	fps: number;
	drawCalls: number;
	triangles: number;
	memory: number;
	wireframe: boolean;
	noTextures: boolean;
	noPostProcess: boolean;
	grid: boolean;
	shadows: boolean;
	fog: boolean;
	ambient: number;
	exposure: number;
	giEnabled: boolean;
	latency: number;
	packets: boolean;
	interpolate: boolean;
	bufferSize: number;
	showHitboxes: boolean;
	showBounds: boolean;
	showNames: boolean;
	showObjectCenters: boolean;
	showRaycast: boolean;
	showPathfinding: boolean;
	showSkeleton: boolean;
	showFrustum: boolean;
	showLightVolumes: boolean;
	showGridOrigin: boolean;
	showLOD: boolean;
	showHoverOverlay: boolean;
	statsOverlayPos: "top-right" | "top-left" | "bottom-right" | "bottom-left";
	gameTickRate: number;
	freezeFrames: boolean;
	stepRequested: boolean;
	gravityScale: number;
	subStepping: number;
	godMode: boolean;
	noclip: boolean;
	infiniteResources: boolean;
	quickSaveRequested: boolean;
	quickLoadRequested: boolean;
};
const DEFAULT_ENGINE: EngineState = {
	frameCount: 0,
	paused: false,
	timeScale: 1,
	gravity: 9.8,
	fps: 0,
	drawCalls: 0,
	triangles: 0,
	memory: 0,
	wireframe: false,
	noTextures: false,
	noPostProcess: false,
	grid: false,
	shadows: true,
	fog: true,
	ambient: 0.5,
	exposure: 1.0,
	giEnabled: true,
	latency: 0,
	packets: false,
	interpolate: true,
	bufferSize: 5,
	showHitboxes: false,
	showBounds: false,
	showNames: false,
	showObjectCenters: false,
	showRaycast: false,
	showPathfinding: false,
	showSkeleton: false,
	showFrustum: false,
	showLightVolumes: false,
	showGridOrigin: false,
	showLOD: false,
	showHoverOverlay: false,
	statsOverlayPos: "top-right" as const,
	gameTickRate: 0,
	freezeFrames: false,
	stepRequested: false,
	gravityScale: 1.0,
	subStepping: 1,
	godMode: false,
	noclip: false,
	infiniteResources: false,
	quickSaveRequested: false,
	quickLoadRequested: false
};
let _frameCount = 0;
export function DebugPanel() {
	const [activeTab, setActiveTab] = useState("logs");
	const [collapsed, setCollapsed] = useState(false);
	const [isDraggingPanel, setIsDraggingPanel] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [position, setPosition] = useState({ x: 50, y: 50 });
	const [frameCount, setFrameCount] = useState(0);
	const [badges, setBadges] = useState<string[]>([]);
	const [engine, setEngine] = useState<EngineState>(DEFAULT_ENGINE);
	const [filterTags, setFilterTags] = useState<string[]>([]);
	const [consoleFontSize, setConsoleFontSize] = useState(11);
	const panelRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const interval = setInterval(() => {
			const eng = window.__engine;
			if (eng) setEngine({ ...eng });
			setFrameCount(++_frameCount);
			const newBadges: string[] = [];
			const cfg = Logger.getDebugConfig();
			if ((cfg.logFrameCount ?? 0) > 1) newBadges.push(`Logging every ${cfg.logFrameCount} frames`);
			if (cfg.freezeFrames) newBadges.push("FROZEN");
			if ((cfg.gameTickRate ?? 0) > 0) newBadges.push(`Tick rate: ${cfg.gameTickRate}ms`);
			setBadges(newBadges);
		}, 100);
		window.__engine = window.__engine ?? { ...DEFAULT_ENGINE };
		return () => clearInterval(interval);
	}, []);
	const handlePanelMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if ((e.target as HTMLElement).closest(".dbg-tabs, .dbg-bar-buttons, .dbg-controls")) return;
			setIsDraggingPanel(true);
			setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
		},
		[position]
	);
	const handleConsoleFontSizeChange = useCallback((delta: number) => {
		setConsoleFontSize((prev) => Math.max(6, Math.min(24, prev + delta)));
	}, []);
	useEffect(() => {
		if (!isDraggingPanel) return;
		const handleMouseMove = (e: MouseEvent) => {
			if (isDraggingPanel) {
				setPosition({
					x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 600)),
					y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 200))
				});
			}
		};
		const handleMouseUp = () => {
			setIsDraggingPanel(false);
		};
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDraggingPanel, dragOffset]);
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "F1") {
				e.preventDefault();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
	const setEngineVal = useCallback(<K extends keyof EngineState>(key: K, value: EngineState[K]) => {
		if (window.__engine) (window.__engine as Record<string, unknown>)[key] = value;
		setEngine((prev) => ({ ...prev, [key]: value }) as EngineState);
	}, []);
	return (
		<>
			{collapsed ? (
				<div ref={panelRef} className="dbg-panel dbg-collapsed" style={{ left: position.x, top: position.y }}>
					<div className="dbg-bar" onMouseDown={handlePanelMouseDown}>
						<span className="dbg-title">Debug</span>
						<div className="dbg-bar-buttons">
							<button className="dbg-btn" onClick={() => setCollapsed(false)} title="Expand">
								⬆
							</button>
							<button className="dbg-btn" onClick={() => window.__debugCtrl?.close()} title="Close">
								✕
							</button>
						</div>
					</div>
				</div>
			) : (
				<div ref={panelRef} className={`dbg-panel ${isDraggingPanel ? "dragging" : ""}`} style={{ left: position.x, top: position.y }}>
					<div className="dbg-bar" onMouseDown={handlePanelMouseDown}>
						<span className="dbg-title">Debug Panel</span>
						<div className="dbg-bar-buttons">
							<button className="dbg-btn" onClick={() => setCollapsed(true)} title="Collapse">
								⬇
							</button>
							<button className="dbg-btn" onClick={() => window.__debugCtrl?.close()} title="Close">
								✕
							</button>
						</div>
					</div>
					<div className="dbg-tabs">
						{[
							{ id: "logs", label: "Logs & Tracing" },
							{ id: "worldInspector", label: "World Inspector" },
							{ id: "visualDebug", label: "Visual Debug" },
							{ id: "networking", label: "Networking" },
							{ id: "engineControls", label: "Engine Controls" }
						].map((tab) => (
							<button key={tab.id} className={`dbg-tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
								{tab.label}
							</button>
						))}
						<div className="dbg-tabs-spacer" />
					</div>
					<div className="dbg-controls">
						{activeTab === "logs" && <LoggingSection filterTags={filterTags} setFilterTags={setFilterTags} />}
						{activeTab === "worldInspector" && <WorldInspectorSection showHoverOverlay={engine.showHoverOverlay} />}
						{activeTab === "visualDebug" && <VisualDebugSection engine={engine} setEngineVal={setEngineVal} />}
						{activeTab === "networking" && <NetworkingSection />}
						{activeTab === "engineControls" && <EngineControlsSection engine={engine} setEngineVal={setEngineVal} />}
					</div>
				</div>
			)}
			<ConsoleWindow filterTags={filterTags} setFilterTags={setFilterTags} fontSize={consoleFontSize} onChangeFontSize={handleConsoleFontSizeChange} />
			{engine.statsOverlayPos && <StatsOverlay position={engine.statsOverlayPos} />}
		</>
	);
}
declare global {
	interface Window {
		__debugCtrl?: DebugControl;
		__engine?: EngineState;
		__networkMgr?: any;
		__serverHandler?: any;
		__self?: any;
		__stats?: { fps: number; drawCalls: number; triangles: number; geometries: number; textures: number };
	}
}
