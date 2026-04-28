"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { networkLogger } from "../../debug/NetworkLogger";
import { Logger } from "../../../../1.engine/tools/Logger";
type LogLevel = "log" | "warn" | "error" | "debug" | "info" | "network-in" | "network-out";
interface ConsoleEntry {
	id: number;
	level: LogLevel;
	args: string[];
	timestamp: number;
	tags?: string[];
	isNetwork?: boolean;
	direction?: "incoming" | "outgoing";
	packetType?: string;
	payload?: unknown;
}
interface LogConsoleProps {
	maxHeight?: number;
	filterTags: string[];
	setFilterTags: (tags: string[]) => void;
	fontSize?: number;
	onChangeFontSize?: (delta: number) => void;
}
const PRESET_TAGS = ["AI", "Physics", "Player", "Network", "Input", "Render", "Audio", "Gameplay"];
const LEVEL_COLORS: Record<LogLevel, string> = {
	"debug": "#606080",
	"log": "#a0a0b8",
	"info": "#4a9eff",
	"warn": "#f5a623",
	"error": "#e54545",
	"network-in": "#4aff4a",
	"network-out": "#ff8844"
};
let globalId = 0;
const persistentEntries: ConsoleEntry[] = [];
function formatTime(timestamp: number): string {
	const d = new Date(timestamp);
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	const s = String(d.getSeconds()).padStart(2, "0");
	const ms = String(d.getMilliseconds()).padStart(3, "0");
	return `${h}:${m}:${s}.${ms}`;
}
function serializeArgs(args: unknown[]): string[] {
	return args.map((a) => {
		if (a === null) return "null";
		if (a === undefined) return "undefined";
		if (typeof a === "object") {
			try {
				return JSON.stringify(a);
			} catch {
				return String(a);
			}
		}
		return String(a);
	});
}
export function LogConsole({ maxHeight = 500, filterTags, setFilterTags, fontSize = 10, onChangeFontSize }: LogConsoleProps) {
	const [entries, setEntries] = useState<ConsoleEntry[]>([...persistentEntries]);
	const [filterLevel, setFilterLevel] = useState<LogLevel | "ALL">("ALL");
	const [filterText, setFilterText] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
	const [filterNetwork, setFilterNetwork] = useState(true);
	const [tagsOpen, setTagsOpen] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const userScrolledRef = useRef(false);
	const lastCountRef = useRef(persistentEntries.length);
	useEffect(() => {
		const native = {
			log: console.log.bind(console),
			debug: console.debug?.bind(console),
			info: console.info?.bind(console),
			warn: console.warn.bind(console),
			error: console.error.bind(console)
		};
		let isRendering = false;
		function capture(level: LogLevel) {
			return (...args: unknown[]) => {
				const entry: ConsoleEntry = {
					id: globalId++,
					level,
					args: serializeArgs(args),
					timestamp: Date.now()
				};
				persistentEntries.push(entry);
				if (persistentEntries.length > 1000) persistentEntries.shift();
				if (isRendering) return;
				isRendering = true;
				window.setTimeout(() => {
					(native as Record<string, (...args: unknown[]) => void>)[level]?.(...args);
					isRendering = false;
				}, 0);
			};
		}
		console.log = capture("log");
		console.debug = capture("debug");
		console.info = capture("info");
		console.warn = capture("warn");
		console.error = capture("error");
		const unsubNetwork = networkLogger.onNetworkEntry((packet) => {
			if (networkLogger.getPacketState(packet.type) !== "allow") return;
			const entry: ConsoleEntry = {
				id: globalId++,
				level: packet.direction === "incoming" ? "network-in" : "network-out",
				args: [`[Network] ${packet.direction === "incoming" ? "←" : "→"} ${packet.type}`, packet.payload === undefined ? "undefined" : JSON.stringify(packet.payload)],
				timestamp: packet.timestamp,
				isNetwork: true,
				direction: packet.direction,
				packetType: packet.type,
				payload: packet.payload
			};
			persistentEntries.push(entry);
			if (persistentEntries.length > 1000) persistentEntries.shift();
		});
		return () => {
			Object.assign(console, native);
			unsubNetwork();
		};
	}, []);
	useEffect(() => {
		const interval = setInterval(() => {
			if (persistentEntries.length !== lastCountRef.current) {
				lastCountRef.current = persistentEntries.length;
				setEntries([...persistentEntries]);
			}
		}, 200);
		return () => clearInterval(interval);
	}, []);
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		if (!userScrolledRef.current) {
			el.scrollTop = el.scrollHeight;
		}
	}, [entries]);
	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const el = e.currentTarget;
		const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
		userScrolledRef.current = !atBottom;
	}, []);
	const handleTagToggle = useCallback(
		(tag: string) => {
			if (filterTags.includes(tag)) {
				setFilterTags(filterTags.filter((t) => t !== tag));
			} else {
				setFilterTags([...filterTags, tag]);
			}
		},
		[filterTags, setFilterTags]
	);
	const handleTagInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				const newTag = tagInput.trim();
				if (newTag && !filterTags.includes(newTag)) {
					setFilterTags([...filterTags, newTag]);
				}
				setTagInput("");
			}
		},
		[tagInput, filterTags, setFilterTags]
	);
	const filtered = entries.filter((e) => {
		if (filterLevel !== "ALL" && e.level !== filterLevel) return false;
		if (!filterNetwork && e.isNetwork) return false;
		if (filterText && !e.args.some((a) => a.toLowerCase().includes(filterText.toLowerCase()))) return false;
		if (filterTags.length > 0) {
			const entryTags = e.tags ?? [];
			if (!filterTags.some((t) => entryTags.includes(t))) return false;
		}
		return true;
	});
	const toggleExpand = (id: number) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const handleClear = () => {
		persistentEntries.length = 0;
		setEntries([]);
	};
	const handleClearLogs = () => {
		Logger.clearEntries();
	};
	const handleExportJson = () => {
		const json = JSON.stringify([...persistentEntries], null, 2);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
		const a = document.createElement("a");
		a.href = url;
		a.download = `debug_logs_${ts}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};
	const handleExportTxt = () => {
		const txt = persistentEntries
			.map((e) => {
				const level = e.isNetwork ? `[${e.direction === "incoming" ? "NET IN" : "NET OUT"}]` : `[${e.level.toUpperCase()}]`;
				return `[${e.timestamp}] ${level} ${e.args.join(" ")}`;
			})
			.join("\n");
		const blob = new Blob([txt], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
		const a = document.createElement("a");
		a.href = url;
		a.download = `logs_${ts}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};
	const activeTagCount = filterTags.length;
	return (
		<div className="log-console">
			<div className="log-console-toolbar">
				<div className="lc-row lc-row-main">
					<select className="log-console-level-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as LogLevel | "ALL")}>
						<option value="ALL">ALL</option>
						<option value="debug">DEBUG</option>
						<option value="log">LOG</option>
						<option value="info">INFO</option>
						<option value="warn">WARN</option>
						<option value="error">ERROR</option>
						<option value="network-in">NET IN</option>
						<option value="network-out">NET OUT</option>
					</select>
					<input type="text" className="log-console-text-input" placeholder="Search..." value={filterText} onChange={(e) => setFilterText(e.target.value)} />
					<button className={`log-console-btn ${filterNetwork ? "log-console-btn-active" : ""}`} onClick={() => setFilterNetwork(!filterNetwork)} title="Toggle Network Packets">
						NET
					</button>
					<button className={`log-console-btn ${tagsOpen ? "log-console-btn-active" : ""}`} onClick={() => setTagsOpen((o) => !o)} title="Toggle Tags">
						Tags{activeTagCount > 0 ? ` (${activeTagCount})` : ""}
					</button>
					<button className="log-console-btn" onClick={handleClear} title="Clear logs">
						Clr
					</button>
					<button className="log-console-btn" onClick={handleExportTxt} title="Export TXT">
						TXT
					</button>
					<button className="log-console-btn" onClick={handleExportJson} title="Export JSON">
						JSON
					</button>
				</div>
				{tagsOpen && (
					<div className="lc-row lc-row-tags">
						{PRESET_TAGS.map((tag) => (
							<button key={tag} className={`log-console-tag-btn ${filterTags.includes(tag) ? "active" : ""}`} onClick={() => handleTagToggle(tag)}>
								{tag}
							</button>
						))}
						<input type="text" className="log-console-tag-input" placeholder="+tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} />
						{filterTags.length > 0 && (
							<button className="log-console-btn" onClick={() => setFilterTags([])}>
								Clear
							</button>
						)}
					</div>
				)}
				<div className="lc-row lc-row-font">
					{onChangeFontSize && (
						<>
							<button className="log-console-btn" onClick={() => onChangeFontSize(-1)} title="Decrease font">
								A−
							</button>
							<span className="log-console-font-size" style={{ fontSize: "10px" }}>
								{fontSize}px
							</span>
							<button className="log-console-btn" onClick={() => onChangeFontSize(1)} title="Increase font">
								A+
							</button>
						</>
					)}
				</div>
			</div>
			<div className="log-console-output" ref={scrollRef} onScroll={handleScroll} style={{ maxHeight, fontSize: `${fontSize}px` }}>
				{filtered.length === 0 && <div className="log-console-empty">No entries</div>}
				{filtered.map((entry) => {
					const isExpanded = expandedIds.has(entry.id);
					const hasLongArg = entry.args.some((a) => a.length > 60);
					return (
						<div key={entry.id} className={`log-console-row log-console-row-${entry.level}`}>
							{entry.isNetwork ? (
								<>
									<span className={`log-console-network-dir ${entry.direction}`}>{entry.direction === "incoming" ? "←" : "→"}</span>
									<span className="log-console-badge" style={{ backgroundColor: LEVEL_COLORS[entry.level] }}>
										{entry.packetType}
									</span>
								</>
							) : (
								<span className="log-console-badge" style={{ backgroundColor: LEVEL_COLORS[entry.level] }}>
									{entry.level.toUpperCase()}
								</span>
							)}
							<span className="log-console-time">{formatTime(entry.timestamp)}</span>
							<span className="log-console-msg">{entry.args.join(" ")}</span>
							{hasLongArg && (
								<button className="log-console-expand" onClick={() => toggleExpand(entry.id)}>
									{isExpanded ? "▼" : "▶"}
								</button>
							)}
							{isExpanded && (
								<div className="log-console-expanded">
									{entry.args.map((a, i) => (
										<div key={i} className="log-console-arg">
											{a}
										</div>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
