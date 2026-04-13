import React from "react";
import styled from "styled-components";

// @material-tailwind/react
import {
  Button,
  Typography,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Card,
  CardBody,
} from "@material-tailwind/react";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface KpiCardPropsType {
  title: string;
  percentage: string;
  price: string;
  color: string;
  icon: React.ReactNode;
  nb: React.ReactNode;
}

function KpiCard({
  title,
  icon,
  nb
}: KpiCardPropsType): JSX.Element {
  return (
    <StyledCard>
      <CardBody className="p-4">
        <div className="flex justify-between items-center -mt-2 sm:-mt-2 md:-mt-2 lg:-mt-0">
          <Typography
            className="font-bold text-xs sm:text-sm md:text-sm lg:text-xl text-black ml-[-10px] sm:ml-0" 
          >
            {title}
            <span className="ml-2">{icon}</span>
          </Typography>
          <div className="flex items-center gap-1">
            {nb}
          </div>
        </div>
      </CardBody>
    </StyledCard>
  );
}

const StyledCard = styled(Card)`
  /* Button-inspired style, adapted for Card shape */
  --stone-50: #fafaf9;
  --stone-800: #292524;
  --yellow-400: #facc15;
  background-color: var(--stone-800) !important;
  font-family: 'Inter', 'Segoe UI', 'system-ui', sans-serif;
  color: var(--stone-800);
  border-radius: 1.5rem !important;
  position: relative;
  width: 100%;
  height: 100%;
  box-shadow:
    0.5px 0.5px 0 0 var(--stone-800),
    1px 1px 0 0 var(--stone-800),
    1.5px 1.5px 0 0 var(--stone-800),
    2px 2px 0 0 var(--stone-800),
    2.5px 2.5px 0 0 var(--stone-800),
    3px 3px 0 0 var(--stone-800),
    0 0 0 2px var(--stone-50),
    0.5px 0.5px 0 2px var(--stone-50),
    1px 1px 0 2px var(--stone-50),
    1.5px 1.5px 0 2px var(--stone-50),
    2px 2px 0 2px var(--stone-50),
    2.5px 2.5px 0 2px var(--stone-50),
    3px 3px 0 2px var(--stone-50),
    3.5px 3.5px 0 2px var(--stone-50),
    4px 4px 0 2px var(--stone-50);
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
  transform: translate(-4px, -4px);
  outline: 2px solid transparent;
  outline-offset: 5px;
  &:hover {
    transform: translate(0, 0);
    box-shadow: 0 0 0 2px var(--stone-50);
  }
  &:active,
  &:focus-visible {
    outline-color: var(--yellow-400);
  }
  &:focus-visible {
    outline-style: dashed;
  }
  /* CardBody background for yellow effect */
  .p-4 {
    background-color: var(--yellow-400) !important;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 1.25rem;
    position: relative;
    overflow: hidden;
  }
  .p-4::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 1.25rem;
    opacity: 0.5;
    background-image: radial-gradient(
        rgb(255 255 255 / 80%) 20%,
        transparent 20%
      ),
      radial-gradient(rgb(255 255 255 / 100%) 20%, transparent 20%);
    background-position:
      0 0,
      4px 4px;
    background-size: 8px 8px;
    mix-blend-mode: hard-light;
    animation: dots 0.5s infinite linear;
    z-index: 0;
  }
  .flex {
    position: relative;
    z-index: 1;
  }
  @keyframes dots {
    0% {
      background-position:
        0 0,
        4px 4px;
    }
    100% {
      background-position:
        8px 0,
        12px 4px;
    }
  }
`;

const data = [
  {
    title: "Game",
    nb: <button className="min-w-5 w-5 h-5 sm:min-w-9 sm:w-auto sm:h-auto rounded-full py-0.5 px-1.5 sm:py-2 sm:px-3.5 text-center text-[10px] sm:text-sm transition-all shadow-sm text-white bg-[#0b1328] focus:bg-[#0b1328] focus:text-white active:bg-[#0b1328] active:text-white ml-0 sm:ml-0 md:ml-0 lg:ml-2">
      2
    </button>,
    // icon: "🎮",
  },
  {
    title: "Win",
    nb: <button className="min-w-5 w-5 h-5 sm:min-w-9 sm:w-auto sm:h-auto rounded-full py-0.5 px-1.5 sm:py-2 sm:px-3.5 text-center text-[10px] sm:text-sm transition-all shadow-sm text-white bg-[#0b1328] focus:bg-[#0b1328] focus:text-white active:bg-[#0b1328] active:text-white ml-0 sm:ml-0 md:ml-0 lg:ml-2">
      2
    </button>,
    // icon: "🏆",
  },
  {
    title: "Death",
    nb: <button className="min-w-5 w-5 h-5 sm:min-w-9 sm:w-auto sm:h-auto rounded-full py-0.5 px-1.5 sm:py-2 sm:px-3.5 text-center text-[10px] sm:text-sm transition-all shadow-sm text-white bg-[#0b1328] focus:bg-[#0b1328] focus:text-white active:bg-[#0b1328] active:text-white ml-0 sm:ml-0 md:ml-0 lg:ml-2">
      2
    </button>,
    // icon: "💀",
  },
];

function KpiCard1() {
  return (
    <section className="container ">
      <div className="grid grid-flow-col auto-cols-max gap-4">
        {data.map((props, key) => (
    <div key={key}
    className="w-18 h-10 sm:w-40 sm:h-20 md:w-40 md:h-15 lg:w-50 lg:h-18 flex items-center">
          <KpiCard {...(props as any)} />
		  </div>
        ))}
      </div>
    </section>
  );
}

export default KpiCard1;