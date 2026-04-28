"use client";
import { Logger } from "@/ThreeWrapper/1.engine/tools/Logger";
import type { LogEntry, VerbosityLevel } from "@/ThreeWrapper/1.engine/tools/Logger";
export type TraceFilter = {
	levels?: Array<"DEBUG" | "INFO" | "WARN" | "ERROR">;
	namespaces?: string[];
	contains?: string;
	onlyUseful?: boolean;
};
export type WorldDelta = {
	objectChanges: Array<{
		id: string;
		before?: Partial<{ position: { x: number; y: number; z: number }; velocity?: { x: number; y: number; z: number }; extraData?: Record<string, any> }>;
		after: Partial<{ position: { x: number; y: number; z: number }; velocity?: { x: number; y: number; z: number }; extraData?: Record<string, any> }>;
	}>;
	newObjects?: Array<{ id: string; type: string }>;
	removedObjects?: string[];
};
export type VariableDelta = {
	name: string;
	before?: any;
	after: any;
};
export type TraceEntry = LogEntry & {
	worldDelta?: WorldDelta;
	variableDeltas?: VariableDelta[];
	callStack?: string;
};
class TraceRecorder {
	private static instance: TraceRecorder | null = null;
	private entries: TraceEntry[] = [];
	private recording = false;
	private filters: TraceFilter = {};
	private idCounter = 0;
	private lastWorldSnapshot?: Array<{
		id: string;
		position: { x: number; y: number; z: number };
		velocity?: { x: number; y: number; z: number };
		extraData?: Record<string, any>;
	}>;
	private variableWatch: Map<string, any> = new Map();
	private constructor() {}
	static getInstance(): TraceRecorder {
		if (!TraceRecorder.instance) {
			TraceRecorder.instance = new TraceRecorder();
		}
		return TraceRecorder.instance;
	}
	private passesFilter(entry: LogEntry): boolean {
		if (this.filters.levels?.length && !this.filters.levels.includes(entry.level)) return false;
		if (this.filters.namespaces?.length) {
			const matchNs = this.filters.namespaces.some((ns) => entry.namespace.includes(ns));
			if (!matchNs) return false;
		}
		if (this.filters.contains && !entry.msg.includes(this.filters.contains) && !JSON.stringify(entry.data ?? {}).includes(this.filters.contains)) return false;
		if (this.filters.onlyUseful) {
			const usefulNamespaces = ["Player", "Network", "Gameplay", "Phase", "Error"];
			if (!usefulNamespaces.some((ns) => entry.namespace.includes(ns)) && entry.level !== "ERROR" && entry.level !== "WARN") return false;
			if (entry.namespace.includes("Physics") && entry.level === "DEBUG") return false; 
		}
		return true;
	}
	record(entry: LogEntry): void {
		if (!this.recording) return;
		if (!this.passesFilter(entry)) return;
		const enhancedEntry: TraceEntry = {
			...entry,
			timestamp: entry.timestamp ?? Date.now(),
			callStack: entry.stack ?? (entry.level === "ERROR" ? new Error().stack : undefined)
		};
		this.entries.push(enhancedEntry);
	}
	start(filters?: TraceFilter): void {
		this.entries = [];
		this.recording = true;
		if (filters) this.filters = filters;
	}
	stop(): TraceEntry[] {
		this.recording = false;
		return [...this.entries];
	}
	getEntries(): TraceEntry[] {
		return [...this.entries];
	}
	clear(): void {
		this.entries = [];
		this.filters = {};
	}
	isRecording(): boolean {
		return this.recording;
	}
	setFilters(filters: TraceFilter): void {
		this.filters = filters;
	}
	getFilters(): TraceFilter {
		return { ...this.filters };
	}
	captureWorldDelta(): void {
		if (!this.recording) return;
		const objects = window.__debugCtrl?.getAllObjects?.() ?? [];
		const currentSnapshot = objects.map((obj) => {
			const fullObj = window.__debugCtrl?.getObjectById?.(obj.id);
			return {
				id: obj.id,
				position: fullObj ? { ...fullObj.position } : { x: 0, y: 0, z: 0 },
				velocity: fullObj?.velocity ? { ...fullObj.velocity } : undefined,
				extraData: fullObj?.extraData ? { ...fullObj.extraData } : undefined
			};
		});
		if (!this.lastWorldSnapshot) {
			this.lastWorldSnapshot = currentSnapshot;
			return;
		}
		const changes: WorldDelta["objectChanges"] = [];
		const currentIds = new Set(currentSnapshot.map((o) => o.id));
		const lastIds = new Set(this.lastWorldSnapshot.map((o) => o.id));
		const newIds = [...currentIds].filter((id) => !lastIds.has(id));
		const removedIds = [...lastIds].filter((id) => !currentIds.has(id));
		for (const curr of currentSnapshot) {
			const last = this.lastWorldSnapshot.find((l) => l.id === curr.id);
			if (!last) continue;
			const change: any = { id: curr.id };
			if (JSON.stringify(last.position) !== JSON.stringify(curr.position)) {
				change.before = { position: last.position };
				change.after = { position: curr.position };
			}
			if (JSON.stringify(last.velocity) !== JSON.stringify(curr.velocity)) {
				change.before = { ...change.before, velocity: last.velocity };
				change.after = { ...change.after, velocity: curr.velocity };
			}
			if (JSON.stringify(last.extraData) !== JSON.stringify(curr.extraData)) {
				change.before = { ...change.before, extraData: last.extraData };
				change.after = { ...change.after, extraData: curr.extraData };
			}
			if (change.before || change.after) changes.push(change);
		}
		if (changes.length > 0 || newIds.length > 0 || removedIds.length > 0) {
			const delta: WorldDelta = {
				objectChanges: changes,
				newObjects: newIds.map((id) => ({ id, type: objects.find((o) => o.id === id)?.type ?? "unknown" })),
				removedObjects: removedIds
			};
			if (this.entries.length > 0) {
				this.entries[this.entries.length - 1].worldDelta = delta;
			} else {
				this.entries.push({
					level: "INFO",
					namespace: "Trace",
					msg: "World state delta",
					data: { delta },
					timestamp: Date.now(),
					worldDelta: delta
				});
			}
		}
		this.lastWorldSnapshot = currentSnapshot;
	}
	watchVariable(name: string, value: any): void {
		if (!this.recording) return;
		const oldValue = this.variableWatch.get(name);
		if (oldValue !== value) {
			const delta: VariableDelta = { name, before: oldValue, after: value };
			if (this.entries.length > 0) {
				this.entries[this.entries.length - 1].variableDeltas = this.entries[this.entries.length - 1].variableDeltas || [];
				this.entries[this.entries.length - 1].variableDeltas!.push(delta);
			}
			this.variableWatch.set(name, value);
		}
	}
	setUsefulFilter(): void {
		this.filters.onlyUseful = true;
		this.filters.levels = ["INFO", "WARN", "ERROR"]; 
	}
	exportToHtml(entries: TraceEntry[]): string {
		const duration = entries.length > 1 ? entries[entries.length - 1].timestamp - entries[0].timestamp : 0;
		const startTime = entries[0]?.timestamp ?? Date.now();
		return `<!DOCTYPE html>
<html>
<head>
  <title>Perfect Trace Report</title>
  <style>
    body { font-family: monospace; background: #1a1a2e; color: #e0e0e0; padding: 20px; }
    h1 { color: #4a9eff; }
    .summary { background: #16213e; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .summary-item { margin: 5px 0; }
    .timeline { position: relative; height: 50px; background: #0f0f23; border-radius: 4px; margin-bottom: 20px; }
    .timeline-event { position: absolute; width: 2px; background: #4a9eff; height: 100%; }
    .timeline-event:hover { background: #00d4ff; }
    .entry { padding: 8px; margin: 4px 0; border-radius: 4px; background: #16213e; }
    .entry.ERROR { border-left: 4px solid #ff4444; }
    .entry.WARN { border-left: 4px solid #ffaa44; }
    .entry.INFO { border-left: 4px solid #44aaff; }
    .entry.DEBUG { border-left: 4px solid #44ff44; }
    .delta { margin-left: 20px; font-size: 0.9em; color: #aaa; }
    .collapsed { display: none; }
    .expandable { cursor: pointer; user-select: none; }
    .expandable::before { content: '▶ '; }
    .expandable.expanded::before { content: '▼ '; }
  </style>
  <script>
    function toggle(id) {
      const el = document.getElementById(id);
      el.classList.toggle('collapsed');
      el.previousElementSibling.classList.toggle('expanded');
    }
  </script>
</head>
<body>
  <h1>Perfect Trace Report</h1>
  <div class="summary">
    <div class="summary-item">Duration: ${(duration / 1000).toFixed(2)}s</div>
    <div class="summary-item">Entries: ${entries.length}</div>
    <div class="summary-item">Start: ${new Date(startTime).toLocaleString()}</div>
  </div>
  <div class="timeline">
    ${entries
		.map((e, i) => {
			const left = entries.length > 1 ? ((e.timestamp - startTime) / duration) * 100 : 0;
			return `<div class="timeline-event" style="left: ${left}%" title="${e.level}: ${e.msg}"></div>`;
		})
		.join("")}
  </div>
  ${entries
		.map(
			(e, i) => `
    <div class="entry ${e.level}">
      <div class="expandable" onclick="toggle('entry-${i}')">[${new Date(e.timestamp).toLocaleTimeString()}] ${e.namespace}: ${e.msg}</div>
      <div id="entry-${i}" class="collapsed">
        ${e.data ? `<div>Data: ${JSON.stringify(e.data, null, 2)}</div>` : ""}
        ${e.callStack ? `<div>Stack: <pre>${e.callStack}</pre></div>` : ""}
        ${e.worldDelta ? `<div class="delta">World Delta: ${JSON.stringify(e.worldDelta, null, 2)}</div>` : ""}
        ${e.variableDeltas ? `<div class="delta">Variable Deltas: ${JSON.stringify(e.variableDeltas, null, 2)}</div>` : ""}
      </div>
    </div>
  `
		)
		.join("")}
</body>
</html>`;
	}
}
export const traceRecorder = TraceRecorder.getInstance();
