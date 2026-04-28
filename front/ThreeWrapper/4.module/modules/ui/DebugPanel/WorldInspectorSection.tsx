"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ObjectInspector } from "./ObjectInspector";
import { Logger } from "../../../../1.engine/tools/Logger";
import type { ObjectSummary } from "./DebugPanel";
const OBJECT_TYPES = ["player", "npc", "map"] as const;
type OBJECT_TYPE = (typeof OBJECT_TYPES)[number];
interface WorldInspectorSectionProps {
	maxHeight?: number;
	showHoverOverlay?: boolean;
}
interface ExtendedObjectSummary extends ObjectSummary {
	distance: number;
}
export function WorldInspectorSection({ maxHeight = 400, showHoverOverlay = false }: WorldInspectorSectionProps) {
	const [objects, setObjects] = useState<ExtendedObjectSummary[]>([]);
	const [search, setSearch] = useState("");
	const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set(OBJECT_TYPES));
	const [sortBy, setSortBy] = useState<"name" | "type" | "distance">("distance");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [pinnedId, setPinnedId] = useState<string | null>(null);
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [hoverOverlayEnabled, setHoverOverlayEnabled] = useState(Logger.getDebugConfig().showHoverOverlay ?? false);
	const [selfPlayerId, setSelfPlayerId] = useState<string | null>(null);
	const toggleHoverOverlay = useCallback(() => {
		const newVal = !hoverOverlayEnabled;
		setHoverOverlayEnabled(newVal);
		const cfg = Logger.getDebugConfig();
		Logger.setDebugConfig({ ...cfg, showHoverOverlay: newVal });
	}, [hoverOverlayEnabled]);
	useEffect(() => {
		const updateObjects = () => {
			const all = window.__debugCtrl?.getAllObjects?.() ?? [];
			const selfId = window.__debugCtrl?.getSelfPlayerId?.() ?? null;
			const selfObj = selfId ? window.__debugCtrl?.getObjectById?.(selfId) : null;
			const selfPos = selfObj?.position ?? { x: 0, y: 0, z: 0 };
			const extended: ExtendedObjectSummary[] = all.map((obj) => ({
				...obj,
				distance: Math.sqrt((obj.position.x - selfPos.x) ** 2 + (obj.position.y - selfPos.y) ** 2 + (obj.position.z - selfPos.z) ** 2)
			}));
			setObjects(extended);
			setSelfPlayerId(selfId);
		};
		updateObjects();
		const interval = setInterval(updateObjects, 500);
		return () => clearInterval(interval);
	}, []);
	useEffect(() => {
		const handleHover = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			if (detail?.object) {
				setHoveredId(detail.object.id);
			} else {
				setHoveredId(null);
			}
		};
		const handlePin = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			if (detail?.object) {
				setPinnedId(detail.object.id);
				setSelectedId(detail.object.id);
			}
		};
		window.addEventListener("debug:hover", handleHover as EventListener);
		window.addEventListener("debug:pin", handlePin as EventListener);
		return () => {
			window.removeEventListener("debug:hover", handleHover as EventListener);
			window.removeEventListener("debug:pin", handlePin as EventListener);
		};
	}, []);
	const filtered = useMemo(() => {
		let result = objects.filter((obj) => {
			if (!typeFilters.has(obj.type)) return false;
			if (search) {
				const s = search.toLowerCase();
				if (!obj.name?.toLowerCase().includes(s) && !obj.id.toLowerCase().includes(s)) return false;
			}
			return true;
		});
		if (sortBy === "name") {
			result = [...result].sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
		} else if (sortBy === "type") {
			result = [...result].sort((a, b) => a.type.localeCompare(b.type));
		} else if (sortBy === "distance") {
			result = [...result].sort((a, b) => a.distance - b.distance);
		}
		return result;
	}, [objects, search, typeFilters, sortBy]);
	const toggleType = useCallback((type: string) => {
		setTypeFilters((prev) => {
			const next = new Set(prev);
			if (next.has(type)) next.delete(type);
			else next.add(type);
			return next;
		});
	}, []);
	const handleSelect = useCallback((id: string) => {
		setSelectedId(id);
		if (id !== "camera") {
			window.__debugCtrl?.pinObject(id);
		}
	}, []);
	const handleClear = useCallback(() => {
		setSelectedId(null);
		setPinnedId(null);
	}, []);
	const handleRefresh = useCallback(() => {
		const all = window.__debugCtrl?.getAllObjects?.() ?? [];
		const selfId = window.__debugCtrl?.getSelfPlayerId?.() ?? null;
		const selfObj = selfId ? window.__debugCtrl?.getObjectById?.(selfId) : null;
		const selfPos = selfObj?.position ?? { x: 0, y: 0, z: 0 };
		const extended: ExtendedObjectSummary[] = all.map((obj) => ({
			...obj,
			distance: Math.sqrt((obj.position.x - selfPos.x) ** 2 + (obj.position.y - selfPos.y) ** 2 + (obj.position.z - selfPos.z) ** 2)
		}));
		setObjects(extended);
	}, []);
	const handleSaveSnapshot = useCallback(() => {
		const name = prompt("Enter snapshot name:");
		if (name) window.__debugCtrl?.saveWorldSnapshot(name);
	}, []);
	const handleLoadSnapshot = useCallback(() => {
		const name = prompt("Enter snapshot name:");
		if (name) window.__debugCtrl?.loadWorldSnapshot(name);
	}, []);
	const displayId = pinnedId ?? selectedId ?? hoveredId;
	return (
		<div className="world-inspector-section">
			<div className="wis-sidebar">
				<div className="wis-toolbar">
					<input type="text" className="wis-search" placeholder="Search objects..." value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
				<div className="wis-controls-row">
					<div className="wis-filters">
						{OBJECT_TYPES.map((type) => (
							<label key={type} className={`wis-filter ${typeFilters.has(type) ? "active" : ""}`}>
								<input type="checkbox" checked={typeFilters.has(type)} onChange={() => toggleType(type)} />
								{type.toUpperCase()}
							</label>
						))}
					</div>
					<div className="wis-sort">
						<select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
							<option value="distance">Distance</option>
							<option value="name">Name</option>
							<option value="type">Type</option>
						</select>
					</div>
					<button className="wis-btn wis-btn-camera" onClick={() => handleSelect("camera")} title="Select Camera">
						📷
					</button>
				</div>
				<div className="wis-actions-row">
					<button className="wis-btn" onClick={handleRefresh}>
						Refresh
					</button>
					<button className="wis-btn primary" onClick={handleSaveSnapshot}>
						Save
					</button>
					<button className="wis-btn" onClick={handleLoadSnapshot}>
						Load
					</button>
					<label className={`wis-filter ${hoverOverlayEnabled ? "active" : ""}`}>
						<input type="checkbox" checked={hoverOverlayEnabled} onChange={toggleHoverOverlay} />
						Hover
					</label>
				</div>
				{}
				<div className="wis-list-container">
					<div className="wis-list-header">
						<div className="wis-col wis-col-main">Objects ({filtered.length})</div>
					</div>
					<div className="wis-list">
						{filtered.length === 0 && <div className="wis-empty">No objects found</div>}
						{filtered.map((obj) => (
							<div key={obj.id} className={`wis-item wis-item-simplified ${displayId === obj.id ? "wis-item-selected" : ""} ${obj.id === selfPlayerId ? "wis-item-self" : ""}`} onClick={() => handleSelect(obj.id)}>
								<span className={`wis-item-type ${obj.type}`}>{obj.type}</span>
								<span className="wis-item-name">{obj.name ?? obj.id}</span>
								{obj.id === selfPlayerId && <span className="wis-item-self-badge">{obj.name ?? "YOU"}</span>}
								<span className="wis-item-dist">{obj.distance.toFixed(0)}m</span>
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="wis-inspector">
				<ObjectInspector selectedId={displayId} onDeselect={handleClear} showHoverOverlay={showHoverOverlay} />
			</div>
		</div>
	);
}
