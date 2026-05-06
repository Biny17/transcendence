"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Background } from "./Background";
import { Navbar } from "./Navbar.jsx";
import OrientationGuard from "./Orientation_Guard.jsx";
import { Button } from "../animations/Button.jsx";
import Chat from "../chat/chat";
import Online from "@/components/cards/Onlineplayers";
import SimpleFooter from "@/components/footers/footer";
import "./page.css";
import Privacy from "./Privacy.jsx";
import LeaderBoard from "@/components/cards/Leaderboard.jsx";
import YourFriends from "@/components/friends/friends_cards.jsx";
import lottie from "lottie-web";
import Bear from "@/public/cute-bear.json";
import { CharacterVisualizerWorld } from "@/ThreeWrapper/2.world/worlds/CharacterVisualizerWorld";
import { EngineCanvas } from "../../ThreeWrapper/1.engine/EngineCanvas";
import "./character_controls.css";
const ANIMATIONS = [
	"FG_Loading_Falling_A",
	"FG_Idle_A",
	"FG_Walk_Right_A",
	"FG_Walk_Left_A",
	"FG_Walk_A",
	"FG_CostumeChangeLooking_A",
	"FG_Idle_Joggingonspot",
	"FG_Idle_TouchingToes",
	"FG_Emote_Chicken_A",
	"FG_Emote_Wave_A",
	"FG_Emote_Neener_A",
	"FG_Emote_ThumbsUp_A",
	"FG_Emote_WaveOverHead_A",
	"FG_Emote_PirateDance_A",
	"FG_Emote_slowclap_A",
	"FG_Emote_RobotDance_A",
	"CH_Fallguy_FG_Emote_Mexwave",
	"CH_Fallguy_FG_emote_HappyClap",
	"FG_Beefcake_A",
	"FG_Emote_Zsnap_A",
	"FG_Emote_Pattycake_A",
	"FG_Emote_Armthrow_A",
	"FG_emote_boxing_01_A",
	"FG_emote_ChestBump_01_A",
	"FG_emote_Salute_01_A",
	"FG_emote_horsey_A",
	"FG_emote_Jester_A",
	"FG_emote_Curtsy_A",
	"FG_emote_Bow_A",
	"FG_emote_comeon_01_A",
	"FG_emote_HONK_01_A",
	"ArmWave_Start",
	"ArmWave_Loop",
	"ArmWave_End"
];
const BODY_COLORS = ["#c000c0", "#ff4444", "#44ff44", "#4444ff", "#ffff00", "#ff8800", "#00ffff", "#ff00ff"];
const FACE_COLORS = ["#ffffff", "#ffcccc", "#ccffcc", "#ccccff", "#ffffcc", "#ffccff", "#ccffff", "#ffddaa"];
const EYE_COLORS = ["#00ff00", "#ff0000", "#0000ff", "#ffff00", "#ff8800", "#00ffff", "#ff00ff", "#8800ff"];
export default function Home() {
	const router = useRouter();
	const [OptionsOpen, setOptionsOpen] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [PrivacyOpen, setPrivacyOpen] = useState(false);
	const [LeaderBoardOpen, setLeaderBoardOpen] = useState(false);
	const [YourFriendsOpen, setYourFriendsOpen] = useState(false);
	const [worldApi, setWorldApi] = useState(null);
	const [currentAnim, setCurrentAnim] = useState("FG_Idle_A");
	const [currentBodyColor, setCurrentBodyColor] = useState("#c000c0");
	const [currentFaceColor, setCurrentFaceColor] = useState("#ffffff");
	const [currentEyeColor, setCurrentEyeColor] = useState("#00ff00");
	const [isChangingColor, setIsChangingColor] = useState(false);
	const bearRef = useRef(null);
	const characterArgsRef = useRef({
		bodyColor: "#c0ccc0",
		faceColor: "#ffffff",
		eyeColor: "#00fff0",
		cameraPos: { x: 0, y: 1.1, z: 1.5 },
		cameraTarget: { x: 0, y: 0.95, z: 0 },
		animation: "FG_Emote_Pattycake_A", //"FG_Idle_A",
		background: false
	});
	useEffect(() => {
		const anim = lottie.loadAnimation({
			container: bearRef.current,
			loop: true,
			autoplay: true,
			animationData: Bear
		});
		return () => {
			anim.destroy();
		};
	}, []);
	const handleAnimationChange = (anim) => {
		setCurrentAnim(anim);
		worldApi?.playAnimation(anim);
	};
	const handleBodyColorChange = async (color) => {
		setCurrentBodyColor(color);
		if (!worldApi) return;
		setIsChangingColor(true);
		await worldApi.setBodyColor(color);
		setIsChangingColor(false);
	};
	const handleFaceColorChange = async (color) => {
		setCurrentFaceColor(color);
		if (!worldApi) return;
		setIsChangingColor(true);
		await worldApi.setFaceColor(color);
		setIsChangingColor(false);
	};
	const handleEyeColorChange = async (color) => {
		setCurrentEyeColor(color);
		if (!worldApi) return;
		setIsChangingColor(true);
		await worldApi.setEyeColor(color);
		setIsChangingColor(false);
	};
	return (
		<OrientationGuard>
			<main className="relative min-h-screen">
				<motion.div animate={{ opacity: isTransitioning ? 0 : 1 }} transition={{ duration: 0.3 }}>
					<Navbar OptionsOpen={OptionsOpen} setOptionsOpen={setOptionsOpen} />

					{/*<div className={`character-controls ${isChangingColor ? "loading" : ""}`}>
					<div className="control-section">
						<span className="control-label">Animation</span>
						<div className="control-buttons">
							{ANIMATIONS.map((anim) => (
								<button key={anim} className={`control-btn ${currentAnim === anim ? "active" : ""}`} onClick={() => handleAnimationChange(anim)}>
									{anim.replace("FG_", "")}
								</button>
							))}
						</div>
					</div>
					<div className="control-section">
						<span className="control-label">Body</span>
						<div className="color-buttons">
							{BODY_COLORS.map((color) => (
								<button key={color} className={`color-btn ${currentBodyColor === color ? "active" : ""}`} style={{ backgroundColor: color }} onClick={() => handleBodyColorChange(color)} />
							))}
						</div>
					</div>
					<div className="control-section">
						<span className="control-label">Face</span>
						<div className="color-buttons">
							{FACE_COLORS.map((color) => (
								<button key={color} className={`color-btn ${currentFaceColor === color ? "active" : ""}`} style={{ backgroundColor: color }} onClick={() => handleFaceColorChange(color)} />
							))}
						</div>
					</div>
					<div className="control-section">
						<span className="control-label">Eyes</span>
						<div className="color-buttons">
							{EYE_COLORS.map((color) => (
								<button key={color} className={`color-btn ${currentEyeColor === color ? "active" : ""}`} style={{ backgroundColor: color }} onClick={() => handleEyeColorChange(color)} />
							))}
						</div>
					</div>
				</div>*/}
					<div className="absolute inset-0 flex items-center justify-center gap-12">
						<div className="flex flex-row items-center gap-12">
							<div className="baloo_button fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
								<div className="w-[200px] h-[200px] sm:w-[200px] sm:h-[200px] md:w-[300px] md:h-[300px] lg:w-[300px] lg:h-[300px] xl:w-[500px] xl:h-[500px]">
									<EngineCanvas config={{ mode: "standalone" }} world={() => new CharacterVisualizerWorld(characterArgsRef.current)} onReady={(world) => setWorldApi(world)} style={{ width: "full", height: "500px" /*TODO FIX HEIGHT */ }} />
								</div>
								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: OptionsOpen ? 0 : 1, y: OptionsOpen ? 20 : 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
									<div className="grid grid-flow-col auto-cols-max gap-4">
										<Button statement="Your Friends" onClick={() => setYourFriendsOpen(true)} />
										<Button
											statement="Let's play"
											onClick={() => {
												setIsTransitioning(true);
												router.push("/online");
											}}
										/>
										<Button statement="LeaderBoard" onClick={() => setLeaderBoardOpen(true)} />
									</div>
								</motion.div>
							</div>
							<div className="chat xl:fixed xl:right-2 xl:top-1/2 xl:-translate-y-1/2">
								<Online OptionsOpen={OptionsOpen} />
							</div>
						</div>
					</div>
					<div className="chat">
						<Chat OptionsOpen={OptionsOpen} />
					</div>
					<div className="absolute inset-x-4 bottom-5 h-17 ...">
						<SimpleFooter setPrivacyOpen={setPrivacyOpen} />
					</div>
					{PrivacyOpen && (
						<div className="modal-overlay backdrop-blur-sm">
							<Privacy setPrivacyOpen={setPrivacyOpen} />
						</div>
					)}
					{LeaderBoardOpen && <LeaderBoard setLeaderBoardOpen={setLeaderBoardOpen} />}
					{YourFriendsOpen && <YourFriends setYourFriendsOpen={setYourFriendsOpen} />}
				</motion.div>
			</main>
		</OrientationGuard>
	);
}
