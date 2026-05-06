import React from "react";
import styled from "styled-components";
import Lightning from "@/app/animations/Lightning";

const Overlay = styled.div`
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2rem;
	z-index: 100;
	pointer-events: none;
`;

const LightningWrapper = styled.div`
	position: absolute;
	inset: 0;
	opacity: 0.6;
	mix-blend-mode: screen;
`;

const ContentWrapper = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
`;

const Title = styled.h1`
	font-family: system-ui, sans-serif;
	font-size: 28px;
	font-weight: 700;
	color: white;
	text-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
	letter-spacing: 2px;
	margin: 0;

	@media (min-width: 1024px) {
		font-size: 36px;
	}
`;

const Subtitle = styled.p`
	font-family: system-ui, sans-serif;
	font-size: 18px;
	font-weight: 400;
	color: rgba(255, 255, 255, 0.7);
	margin: 0;
	animation: pulse 2s ease-in-out infinite;

	@media (min-width: 1024px) {
		font-size: 22px;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}
`;

const SpinnerDots = styled.div`
	display: flex;
	gap: 8px;
	margin-top: 0.5rem;

	span {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7c3aed, #ec4899);
		animation: bounce 1.4s ease-in-out infinite;

		&:nth-of-type(1) {
			animation-delay: 0s;
		}
		&:nth-of-type(2) {
			animation-delay: 0.2s;
		}
		&:nth-of-type(3) {
			animation-delay: 0.4s;
		}
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: scale(0.6);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}
`;

interface ConnectingUIProps {
	serverName?: string;
}

export const ConnectingUI: React.FC<ConnectingUIProps> = ({ serverName = "game server" }) => {
	return (
		<Overlay>
			<LightningWrapper>
				<Lightning hue={260} xOffset={0} speed={0.8} intensity={0.4} size={1.5} transparent />
			</LightningWrapper>
			<ContentWrapper>
				<Title>CONNECTING</Title>
				<Subtitle>Establishing connection to {serverName}</Subtitle>
				<SpinnerDots>
					<span />
					<span />
					<span />
				</SpinnerDots>
			</ContentWrapper>
		</Overlay>
	);
};
