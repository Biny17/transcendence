"use client";
import { useCallback } from "react";
import { Logger } from "../../../../1.engine/tools/Logger";
import type { EngineState } from "./DebugPanel";
const VISUAL_HITBOX_KEYS = ["showHitboxes", "showBounds"] as const;
const VISUAL_OBJECT_KEYS = ["showNames", "showObjectCenters", "showSkeleton", "showLOD"] as const;
const VISUAL_SCENE_KEYS = ["showRaycast", "showPathfinding", "showFrustum", "showLightVolumes", "showGridOrigin"] as const;
interface VisualDebugSectionProps {
	engine: EngineState;
	setEngineVal: <K extends keyof EngineState>(key: K, value: EngineState[K]) => void;
}
export function VisualDebugSection({ engine, setEngineVal }: VisualDebugSectionProps) {
	const handleChange = useCallback(
		(key: keyof EngineState, value: boolean) => {
			const newConfig = { ...Logger.getDebugConfig(), [key]: value };
			Logger.setDebugConfig(newConfig);
			setEngineVal(key, value);
		},
		[setEngineVal]
	);
	const handleUncheckAll = useCallback(
		(keys: readonly (keyof EngineState)[]) => {
			keys.forEach((k) => {
				if (typeof engine[k] === "boolean") handleChange(k as keyof EngineState, false);
			});
		},
		[engine, handleChange]
	);
	return (
		<>
			<div className="dbg-control-group">
				<div className="dbg-group-header">
					<span className="dbg-group-title">Hitbox / Bounds</span>
					<button className="dbg-clear-btn" onClick={() => handleUncheckAll(VISUAL_HITBOX_KEYS)}>
						Clear
					</button>
				</div>
				<div className="dbg-control-grid">
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showHitboxes} onChange={(e) => handleChange("showHitboxes", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Hitboxes</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showBounds} onChange={(e) => handleChange("showBounds", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Bounds</span>
					</label>
				</div>
			</div>
			<div className="dbg-control-group">
				<div className="dbg-group-header">
					<span className="dbg-group-title">Object Info</span>
					<button className="dbg-clear-btn" onClick={() => handleUncheckAll(VISUAL_OBJECT_KEYS)}>
						Clear
					</button>
				</div>
				<div className="dbg-control-grid">
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showNames} onChange={(e) => handleChange("showNames", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Names</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showObjectCenters} onChange={(e) => handleChange("showObjectCenters", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Object Centers</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showSkeleton} onChange={(e) => handleChange("showSkeleton", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Skeleton / Bones</span>
						<span className="dbg-wip-badge">WIP</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showLOD} onChange={(e) => handleChange("showLOD", e.target.checked)} />
						<span className="dbg-checkbox-text">Show LOD Level</span>
						<span className="dbg-wip-badge">WIP</span>
					</label>
				</div>
			</div>
			<div className="dbg-control-group">
				<div className="dbg-group-header">
					<span className="dbg-group-title">Scene Debug</span>
					<span className="dbg-wip-badge">WIP</span>
					<button className="dbg-clear-btn" onClick={() => handleUncheckAll(VISUAL_SCENE_KEYS)}>
						Clear
					</button>
				</div>
				<div className="dbg-control-grid">
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showRaycast} onChange={(e) => handleChange("showRaycast", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Raycast</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showPathfinding} onChange={(e) => handleChange("showPathfinding", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Pathfinding</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showFrustum} onChange={(e) => handleChange("showFrustum", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Camera Frustum</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showLightVolumes} onChange={(e) => handleChange("showLightVolumes", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Light Volumes</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.showGridOrigin} onChange={(e) => handleChange("showGridOrigin", e.target.checked)} />
						<span className="dbg-checkbox-text">Show Grid + Origin</span>
					</label>
				</div>
			</div>
			<div className="dbg-control-group">
				<div className="dbg-group-header">
					<span className="dbg-group-title">Rendering</span>
				</div>
				<div className="dbg-control-grid">
					<label className="dbg-checkbox-label">
						<input
							type="checkbox"
							className="dbg-checkbox"
							checked={engine.wireframe}
							onChange={(e) => {
								setEngineVal("wireframe", e.target.checked);
								if (window.__engine) window.__engine.wireframe = e.target.checked;
							}}
						/>
						<span className="dbg-checkbox-text">Wireframe</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.noTextures} onChange={(e) => setEngineVal("noTextures", e.target.checked)} />
						<span className="dbg-checkbox-text">No Textures</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.noPostProcess} onChange={(e) => setEngineVal("noPostProcess", e.target.checked)} />
						<span className="dbg-checkbox-text">No Post-Process</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.grid} onChange={(e) => setEngineVal("grid", e.target.checked)} />
						<span className="dbg-checkbox-text">Grid</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.shadows} onChange={(e) => setEngineVal("shadows", e.target.checked)} />
						<span className="dbg-checkbox-text">Shadows</span>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.fog} onChange={(e) => setEngineVal("fog", e.target.checked)} />
						<span className="dbg-checkbox-text">Fog</span>
					</label>
					<label className="dbg-control dbg-control-row">
						<span className="dbg-control-label" style={{ minWidth: 80 }}>
							Exposure
						</span>
						<div className="dbg-slider-container">
							<input type="range" className="dbg-slider" min={0.1} max={3} step={0.1} value={engine.exposure} onChange={(e) => setEngineVal("exposure", parseFloat(e.target.value))} />
							<span className="dbg-slider-value">{engine.exposure.toFixed(1)}</span>
						</div>
					</label>
					<label className="dbg-checkbox-label">
						<input type="checkbox" className="dbg-checkbox" checked={engine.giEnabled} onChange={(e) => setEngineVal("giEnabled", e.target.checked)} />
						<span className="dbg-checkbox-text">GI Enabled</span>
					</label>
					<label className="dbg-control dbg-control-row">
						<span className="dbg-control-label" style={{ minWidth: 80 }}>
							Ambient
						</span>
						<div className="dbg-slider-container">
							<input type="range" className="dbg-slider" min={0} max={1} step={0.05} value={engine.ambient} onChange={(e) => setEngineVal("ambient", parseFloat(e.target.value))} />
							<span className="dbg-slider-value">{engine.ambient.toFixed(2)}</span>
						</div>
					</label>
				</div>
			</div>
		</>
	);
}
