import { useState } from "react";
import type { HitboxState } from "./ComponentCreatorUI";
import type { AutoMeshOptions } from "@/ThreeWrapper/2.world/util/autoMeshHitbox";
interface Props {
	hitboxes: HitboxState[];
	hoveredIdx: number | null;
	selectedIdx: number | null;
	isSelectingSecond: boolean;
	onGenerate: (opts: AutoMeshOptions) => void;
	onMerge: () => void;
	onDelete: () => void;
	onClearSelection: () => void;
	onHitboxUpdate: (idx: number, updates: Partial<HitboxState>) => void;
}
const C = {
	bg: "rgba(10, 10, 28, 0.88)",
	border: "rgba(68, 170, 255, 0.2)",
	text: "#aac8ee",
	textDim: "#557799",
	textBright: "#88ccff",
	accent: "#44aaff",
	selectedBg: "rgba(68,170,255,0.18)",
	btnBg: "rgba(68,170,255,0.12)",
	btnBorder: "rgba(68,170,255,0.35)",
	btnDisabledText: "#334455",
};
export function HitboxEditorPanel({
	hitboxes, hoveredIdx, selectedIdx, isSelectingSecond,
	onGenerate, onMerge, onDelete, onClearSelection, onHitboxUpdate,
}: Props) {
	const [minSize, setMinSize] = useState(0.05);
	const [maxCount, setMaxCount] = useState(30);
	const [mergeDist, setMergeDist] = useState(0.05);
	const [preferShape, setPreferShape] = useState<"box" | "sphere" | "capsule">("box");
	const [preserveMaterials, setPreserveMaterials] = useState(true);
	const opts: AutoMeshOptions = { minSize, maxCount, mergeDist, preferShape, preserveMaterials };
	const canMerge = selectedIdx !== null && hoveredIdx !== null && selectedIdx !== hoveredIdx;
	const canDelete = selectedIdx !== null;
	return (
		<div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "10px", color: C.textDim, letterSpacing: "0.05em", textTransform: "uppercase" }}>
				Hitbox Editor
			</div>
			<fieldset style={{ border: `1px solid ${C.border}`, borderRadius: "3px", padding: "6px", marginBottom: "6px" }}>
				<legend style={{ fontSize: "10px", color: C.textDim }}>Generation</legend>
				<div style={{ marginBottom: "6px" }}>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
						<span style={{ fontSize: "10px", color: C.textDim }}>Min size (m)</span>
						<span style={{ fontSize: "10px", color: C.textBright }}>{minSize.toFixed(2)}</span>
					</div>
					<input
						type="range"
						min="0.01"
						max="0.5"
						step="0.01"
						value={minSize}
						onChange={(e) => setMinSize(+e.target.value)}
						style={{ width: "100%", cursor: "pointer" }}
					/>
				</div>
				<div style={{ marginBottom: "6px" }}>
					<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Max count</div>
					<input
						type="number"
						min="1"
						max="200"
						value={maxCount}
						onChange={(e) => setMaxCount(+e.target.value || 30)}
						style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${C.btnBorder}`, borderRadius: "3px", color: C.textBright, fontFamily: "monospace", fontSize: "12px", padding: "4px 6px", outline: "none", boxSizing: "border-box" }}
					/>
				</div>
				<div style={{ marginBottom: "6px" }}>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
						<span style={{ fontSize: "10px", color: C.textDim }}>Merge distance (m)</span>
						<span style={{ fontSize: "10px", color: C.textBright }}>{mergeDist.toFixed(2)}</span>
					</div>
					<input
						type="range"
						min="0"
						max="0.5"
						step="0.01"
						value={mergeDist}
						onChange={(e) => setMergeDist(+e.target.value)}
						style={{ width: "100%", cursor: "pointer" }}
					/>
				</div>
				<div style={{ marginBottom: "6px" }}>
					<div style={{ fontSize: "10px", color: C.textDim, marginBottom: "2px" }}>Prefer shape</div>
					<select
						value={preferShape}
						onChange={(e) => setPreferShape(e.target.value as "box" | "sphere" | "capsule")}
						style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${C.btnBorder}`, borderRadius: "3px", color: C.textBright, fontFamily: "monospace", fontSize: "12px", padding: "4px 6px", outline: "none", boxSizing: "border-box" }}>
						<option value="box">Box</option>
						<option value="sphere">Sphere</option>
						<option value="capsule">Capsule</option>
					</select>
				</div>
				<div style={{ marginBottom: "6px" }}>
					<label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", cursor: "pointer" }}>
						<input
							type="checkbox"
							checked={preserveMaterials}
							onChange={(e) => setPreserveMaterials(e.target.checked)}
						/>
						Preserve material groups
					</label>
				</div>
				<button
					onClick={() => onGenerate(opts)}
					style={{
						width: "100%",
						padding: "6px 4px",
						background: C.btnBg,
						border: `1px solid ${C.btnBorder}`,
						borderRadius: "3px",
						color: C.textBright,
						cursor: "pointer",
						fontFamily: "monospace",
						fontSize: "11px",
						letterSpacing: "0.04em",
					}}>
					Generate Hitboxes
				</button>
			</fieldset>
			<fieldset style={{ border: `1px solid ${C.border}`, borderRadius: "3px", padding: "6px", marginBottom: "6px" }}>
				<legend style={{ fontSize: "10px", color: C.textDim }}>Edit</legend>
				<div style={{ display: "flex", gap: "4px" }}>
					<button
						onClick={onMerge}
						disabled={!canMerge}
						style={{
							flex: 1,
							padding: "5px 4px",
							background: !canMerge ? "transparent" : C.btnBg,
							border: `1px solid ${!canMerge ? "rgba(68,170,255,0.1)" : C.btnBorder}`,
							borderRadius: "3px",
							color: !canMerge ? C.btnDisabledText : C.textBright,
							cursor: !canMerge ? "default" : "pointer",
							fontFamily: "monospace",
							fontSize: "10px",
						}}>
						{isSelectingSecond ? "Click 2nd →" : "Merge"}
					</button>
					<button
						onClick={onDelete}
						disabled={!canDelete}
						style={{
							flex: 1,
							padding: "5px 4px",
							background: !canDelete ? "transparent" : "rgba(255,68,68,0.1)",
							border: `1px solid ${!canDelete ? "rgba(68,170,255,0.1)" : "rgba(255,68,68,0.35)"}`,
							borderRadius: "3px",
							color: !canDelete ? C.btnDisabledText : "#ff6644",
							cursor: !canDelete ? "default" : "pointer",
							fontFamily: "monospace",
							fontSize: "10px",
						}}>
						Delete
					</button>
					<button
						onClick={onClearSelection}
						disabled={selectedIdx === null}
						style={{
							flex: 1,
							padding: "5px 4px",
							background: selectedIdx === null ? "transparent" : C.btnBg,
							border: `1px solid ${selectedIdx === null ? "rgba(68,170,255,0.1)" : C.btnBorder}`,
							borderRadius: "3px",
							color: selectedIdx === null ? C.btnDisabledText : C.textBright,
							cursor: selectedIdx === null ? "default" : "pointer",
							fontFamily: "monospace",
							fontSize: "10px",
						}}>
						Clear
					</button>
				</div>
			</fieldset>
			<fieldset style={{ border: `1px solid ${C.border}`, borderRadius: "3px", padding: "6px" }}>
				<legend style={{ fontSize: "10px", color: C.textDim }}>
					Hitboxes ({hitboxes.length})
				</legend>
				{hitboxes.length === 0 && (
					<p style={{ fontSize: "10px", color: C.textDim, margin: "4px 0" }}>No hitboxes – click Generate.</p>
				)}
				{hitboxes.map((hb, i) => (
					<HitboxRow
						key={hb.localId}
						idx={i}
						hb={hb}
						isHovered={i === hoveredIdx}
						isSelected={i === selectedIdx}
						onUpdate={onHitboxUpdate}
					/>
				))}
			</fieldset>
			<p style={{ fontSize: "10px", color: C.textDim, margin: "6px 0 0" }}>
				Hover to preview · Click to select · Click 2nd to merge · Del to delete
			</p>
		</div>
	);
}
function HitboxRow({ idx, hb, isHovered, isSelected, onUpdate }: {
	idx: number;
	hb: HitboxState;
	isHovered: boolean;
	isSelected: boolean;
	onUpdate: (idx: number, updates: Partial<HitboxState>) => void;
}) {
	const inputStyle: React.CSSProperties = {
		width: "100%",
		background: "rgba(0,0,0,0.3)",
		border: `1px solid rgba(68,170,255,0.2)`,
		borderRadius: "2px",
		color: "#88ccff",
		fontFamily: "monospace",
		fontSize: "10px",
		padding: "2px 4px",
		outline: "none",
		boxSizing: "border-box",
	};
	return (
		<div
			style={{
				marginBottom: "4px",
				padding: "4px",
				borderRadius: "2px",
				background: isSelected ? "rgba(255,68,68,0.15)" : isHovered ? "rgba(255,170,0,0.1)" : "rgba(0,0,0,0.2)",
				borderLeft: isSelected ? "3px solid #ff4466" : isHovered ? "3px solid #ffaa00" : "3px solid transparent",
			}}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
				<span style={{ fontSize: "10px", color: "#aac8ee" }}>#{idx} {hb.shape}</span>
				<span style={{ fontSize: "9px", color: "#557799" }}>
					{hb.shape === "box" && `${hb.sizeX.toFixed(2)}×${hb.sizeY.toFixed(2)}×${hb.sizeZ.toFixed(2)}`}
					{hb.shape === "sphere" && `r=${hb.radius.toFixed(2)}`}
					{hb.shape === "capsule" && `r=${hb.radius.toFixed(2)} h=${hb.height.toFixed(2)}`}
				</span>
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px" }}>
				<input
					type="number"
					step="0.05"
					placeholder="X"
					value={hb.relativeOffsetX.toFixed(2)}
					onChange={(e) => onUpdate(idx, { relativeOffsetX: +e.target.value, offsetX: +e.target.value })}
					style={inputStyle}
				/>
				<input
					type="number"
					step="0.05"
					placeholder="Y"
					value={hb.relativeOffsetY.toFixed(2)}
					onChange={(e) => onUpdate(idx, { relativeOffsetY: +e.target.value, offsetY: +e.target.value })}
					style={inputStyle}
				/>
				<input
					type="number"
					step="0.05"
					placeholder="Z"
					value={hb.relativeOffsetZ.toFixed(2)}
					onChange={(e) => onUpdate(idx, { relativeOffsetZ: +e.target.value, offsetZ: +e.target.value })}
					style={inputStyle}
				/>
			</div>
		</div>
	);
}
