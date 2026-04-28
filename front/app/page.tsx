"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return null;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				background: "#0d0d0d",
				color: "#fff",
				fontFamily: "monospace",
				gap: "2rem"
			}}>
			<div style={{ textAlign: "center" }}>
				<h1 style={{ margin: 0, fontSize: 32, letterSpacing: 2 }}>Engine</h1>
				<p style={{ margin: "8px 0 0", fontSize: 14, color: "#888" }}>Next.js + Three.js game engine architecture</p>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: 280 }}>
				<Link href="/demo-standalone" style={{ textDecoration: "none" }}>
					<button
						type="button"
						style={{
							width: "100%",
							padding: "0.9rem 2rem",
							fontSize: "1rem",
							background: "#16a34a",
							color: "#fff",
							border: "none",
							borderRadius: "0.5rem",
							cursor: "pointer",
							letterSpacing: 1
						}}>
						Demo — Standalone
					</button>
				</Link>
				<p style={{ margin: "-0.5rem 0 0.5rem", fontSize: 11, color: "#555", textAlign: "center" }}>No server · GravityModule · CollisionModule</p>
				<Link href="/demo-online?username=toto" style={{ textDecoration: "none" }}>
					<button
						type="button"
						style={{
							width: "100%",
							padding: "0.9rem 2rem",
							fontSize: "1rem",
							background: "#2563eb",
							color: "#fff",
							border: "none",
							borderRadius: "0.5rem",
							cursor: "pointer",
							letterSpacing: 1
						}}>
						Demo — Online
					</button>
				</Link>
				<p style={{ margin: "-0.5rem 0 0", fontSize: 11, color: "#555", textAlign: "center" }}>Requires server · Lobby → Loading → Parkour</p>
			</div>
			<div style={{ fontSize: 11, color: "#444", textAlign: "center", maxWidth: 360 }}>
				<p style={{ margin: 0 }}>
					Server: <code style={{ color: "#666" }}>cd server &amp;&amp; bun run index.ts</code>
				</p>
			</div>
		</div>
	);
}
