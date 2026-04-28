"use client";
import { useState, useEffect, useCallback } from "react";
import { Logger, VerbosityLevel, type DebugConfig } from "../../../../1.engine/tools/Logger";
import { PerfectTraceSection } from "./PerfectTraceSection";
interface LoggingSectionProps {
	filterTags: string[];
	setFilterTags: (tags: string[]) => void;
}
const LOG_TYPE_KEYS = [
	"enabled",
	"logPhysicsState",
	"logInputState",
	"logRenderState",
	"logPhases",
	"logVariables",
	"logPhaseDurations",
	"logNetwork",
	"showHitboxes",
	"showBounds",
	"showNames",
	"showObjectCenters",
	"showRaycast",
	"showPathfinding",
	"showSkeleton",
	"showFrustum",
	"showLightVolumes",
	"showGridOrigin",
	"showLOD"
] as const;
type LogTypeKey = (typeof LOG_TYPE_KEYS)[number];
const LOG_TYPE_LABELS: Record<LogTypeKey, string> = {
	enabled: "Custom Logs (console.log)",
	logPhysicsState: "Automatic Physics Logs",
	logInputState: "Automatic Input Logs",
	logRenderState: "Automatic Render Logs",
	logPhases: "Code Tracing (Execution Tree)",
	logVariables: "Variable Inspector (WIP)",
	logPhaseDurations: "Function Entry/Exit Timing",
	logNetwork: "Network Packet Logging",
	showHitboxes: "Show Hitboxes",
	showBounds: "Show Bounds",
	showNames: "Show Object Names",
	showObjectCenters: "Show Object Centers",
	showRaycast: "Show Raycast",
	showPathfinding: "Show Pathfinding",
	showSkeleton: "Show Skeleton",
	showFrustum: "Show Frustum",
	showLightVolumes: "Show Light Volumes",
	showGridOrigin: "Show Grid Origin",
	showLOD: "Show LOD"
};
const LOG_TYPE_COLORS: Partial<Record<LogTypeKey, string>> = {
	enabled: "#00d4ff",
	logPhysicsState: "#f5a623",
	logInputState: "#4aff4a",
	logRenderState: "#ff8844",
	logPhases: "#a855f7",
	logVariables: "#06b6d4",
	logPhaseDurations: "#8b5cf6",
	logNetwork: "#22c55e",
	showHitboxes: "#ef4444",
	showBounds: "#f97316",
	showNames: "#3b82f6",
	showObjectCenters: "#6366f1",
	showRaycast: "#ec4899",
	showPathfinding: "#14b8a6",
	showSkeleton: "#f59e0b",
	showFrustum: "#eab308",
	showLightVolumes: "#fb923c",
	showGridOrigin: "#a3a3a3",
	showLOD: "#a855f7"
};
const LOG_CATEGORIES: { label: string; keys: LogTypeKey[] }[] = [
	{ label: "🎨 Custom Logging", keys: ["enabled"] },
	{ label: "🔧 Automatic Engine Logs", keys: ["logPhysicsState", "logInputState", "logRenderState"] },
	{ label: "🌲 Code Execution", keys: ["logPhases", "logVariables", "logPhaseDurations"] },
	{ label: "🌐 Networking", keys: ["logNetwork"] },
	{ label: "👁️ Visual Debug Overlays", keys: ["showHitboxes", "showBounds", "showNames", "showObjectCenters", "showRaycast", "showPathfinding", "showSkeleton", "showFrustum", "showLightVolumes", "showGridOrigin", "showLOD"] }
];
export function LoggingSection(_props: LoggingSectionProps) {
	const [config, setConfig] = useState(Logger.getDebugConfig());
	const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
	useEffect(() => {
		const interval = setInterval(() => setConfig(Logger.getDebugConfig()), 100);
		return () => clearInterval(interval);
	}, []);
	const handleChange = useCallback((key: LogTypeKey, value: boolean | number) => {
		Logger.setDebugConfig({ ...Logger.getDebugConfig(), [key]: value });
		setConfig(Logger.getDebugConfig());
	}, []);
	const handleLogLevelChange = useCallback((level: VerbosityLevel) => {
		Logger.setGlobalDebugLevel(level);
		setConfig(Logger.getDebugConfig());
	}, []);
	const clearAll = useCallback(() => {
		const cfg = Logger.getDebugConfig();
		const next: DebugConfig = { ...cfg, enabled: cfg.enabled };
		for (const k of LOG_TYPE_KEYS) (next as Record<LogTypeKey, boolean | undefined>)[k] = false;
		Logger.setDebugConfig(next);
		setConfig(Logger.getDebugConfig());
	}, []);
	const toggleCategory = useCallback((label: string) => {
		setCollapsedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(label)) next.delete(label);
			else next.add(label);
			return next;
		});
	}, []);
	return (
		<>
			<div className="dbg-control dbg-control-row">
				<label className="dbg-control-label">Verbosity</label>
				<select className="dbg-select" value={config.verbosityLevel ?? "MEDIUM"} onChange={(e) => handleLogLevelChange(e.target.value as VerbosityLevel)}>
					<option value="NONE">None</option>
					<option value="LOW">Low</option>
					<option value="MEDIUM">Medium</option>
					<option value="HIGH">High</option>
					<option value="INSANE">Insane</option>
				</select>
				<button className="dbg-btn-small" onClick={clearAll} title="Uncheck all">
					Clear All
				</button>
			</div>
			{LOG_CATEGORIES.map((cat) => (
				<div key={cat.label} className="dbg-control-group">
					<div className="dbg-group-header">
						<button className="dbg-btn-small" onClick={() => toggleCategory(cat.label)} style={{ fontSize: "8px", padding: "1px 4px" }}>
							{collapsedCategories.has(cat.label) ? "▶" : "▼"}
						</button>
						<span className="dbg-group-title">{cat.label}</span>
						<span style={{ fontSize: "8px", color: "#404055", marginLeft: "auto" }}>
							{cat.keys.filter((k) => config[k] as boolean).length}/{cat.keys.length}
						</span>
					</div>
					{!collapsedCategories.has(cat.label) && (
						<div className="dbg-control-grid" style={{ marginLeft: "12px" }}>
							{cat.keys.map((k) => (
								<label key={k} className="dbg-checkbox-label">
									<input type="checkbox" className="dbg-checkbox" checked={config[k] ?? false} onChange={(e) => handleChange(k, e.target.checked)} />
									<span className="dbg-checkbox-text" style={{ color: LOG_TYPE_COLORS[k] ?? "#a0a0b8" }}>
										{LOG_TYPE_LABELS[k]}
									</span>
									{!["enabled", "logNetwork"].includes(k) && <span className="dbg-wip-badge">WIP</span>}
								</label>
							))}
						</div>
					)}
				</div>
			))}
			<div className="dbg-control-group" style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1a1a28" }}>
				<div className="dbg-group-header">
					<span className="dbg-group-title">🎯 Perfect Trace Recorder</span>
				</div>
				<PerfectTraceSection />
			</div>
			<div className="dbg-control-group" style={{ marginTop: "8px" }}>
				<div className="dbg-group-header">
					<span className="dbg-group-title">💡 Debugger Window (WIP)</span>
					<span className="dbg-wip-badge">PLANNED</span>
				</div>
				<div style={{ fontSize: "9px", color: "#606080", marginLeft: "12px", lineHeight: "1.6" }}>
					<p>Future toggleable debugger window with:</p>
					<ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
						<li>Code viewer with line-by-line execution</li>
						<li>Execution tree (step path visualization)</li>
						<li>Variable inspector panel</li>
						<li>Step-by-step / breakpoint controls</li>
						<li>Speed slider for execution throttle</li>
					</ul>
				</div>
			</div>
		</>
	);
}
