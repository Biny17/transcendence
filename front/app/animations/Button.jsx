import React from 'react';
import styled from 'styled-components';

export const Button = ({ statement, onClick, isAdded, size = "default", className = "", type = "button" }) => {
  const buttonClassName = `button ${isAdded ? "is-added" : ""} ${size === "compact" ? "is-compact" : ""}`.trim();

  return (
    <StyledWrapper className={className}>
      <button type={type} className={buttonClassName} onClick={onClick}>
        <div><span>{statement}</span></div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    --stone-50: #fafaf9;
    --stone-800: #292524;
    --yellow-400: #facc15;
    --yellow-700: #e5d39d;
    --button-font-size: 1rem;
    --button-pad-y: 0.75rem;
    --button-pad-x: 1.25rem;
    --button-nudge: 4px;

    font-size: var(--button-font-size);
    cursor: pointer;
    position: relative;
    font-family: "Rubik", sans-serif;
    font-weight: bold;
    line-height: 1;
    padding: 1px;
    transform: translate(calc(-1 * var(--button-nudge)), calc(-1 * var(--button-nudge)));
    outline: 2px solid transparent;
    outline-offset: 5px;
    border-radius: 9999px;
    background-color: var(--stone-800);
    color: var(--stone-800);
    transition:
      transform 150ms ease,
      box-shadow 150ms ease;
    text-align: center;
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

    & > div {
      position: relative;
      pointer-events: none;
      background-color: var(--yellow-400);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 9999px;

      &::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 9999px;
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
      }

      & > span {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--button-pad-y) var(--button-pad-x);
        gap: 0.25rem;
        filter: drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.25));

        &:active {
          transform: translateY(2px);
        }
      }
    }

    &.is-added {
      & > div {
        background-color: var(--yellow-700);
      }
    }
  }

  .button.is-compact {
    --button-font-size: 0.72rem;
    --button-pad-y: 0.38rem;
    --button-pad-x: 0.72rem;
    --button-nudge: 2px;
  }

  @media (max-width: 639px) {
    .button {
      --button-font-size: 0.72rem;
      --button-pad-y: 0.45rem;
      --button-pad-x: 0.85rem;
      --button-nudge: 2px;
      margin-left: 0.3rem;
      margin-right: 0.3rem;
    }
  }

  @media (min-width: 640px) and (max-width: 767px) {
    .button {
      --button-font-size: 0.8rem;
      --button-pad-y: 0.5rem;
      --button-pad-x: 0.95rem;
      --button-nudge: 2.5px;
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .button {
      --button-font-size: 0.9rem;
      --button-pad-y: 0.6rem;
      --button-pad-x: 1.1rem;
      --button-nudge: 3px;
    }
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
  }`;
