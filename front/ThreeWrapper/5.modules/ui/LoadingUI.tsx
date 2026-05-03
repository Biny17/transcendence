import React from 'react'
import styled from 'styled-components'
import { Loader } from '@/app/animations/Loader'
import { ProgressSpinner } from '@/app/animations/ProgressSpinner'

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
`

const LoaderWrapper = styled.div`
  .wheel-and-hamster {
    width: 16em;
    height: 16em;
    font-size: 16px;
  }
`

const SpinnerWrapper = styled.div`
  .liquid-loader {
    gap: 8px;
    padding: 24px;
  }

  .loader-track {
    width: 240px;
    height: 40px;
    border-radius: 20px;
  }

  .loading-text {
    font-size: 24px;
  }

  @media (min-width: 1024px) {
    .wheel-and-hamster {
      width: 18em;
      height: 18em;
      font-size: 17px;
    }

    .loader-track {
      width: 280px;
      height: 44px;
      border-radius: 22px;
    }

    .loading-text {
      font-size: 28px;
    }
  }
`

interface LoadingUIProps {
  onFinish?: () => void
}

export const LoadingUI: React.FC<LoadingUIProps> = ({ onFinish }) => {
  return (
    <Overlay>
      <LoaderWrapper>
        <Loader />
      </LoaderWrapper>
      <SpinnerWrapper>
        <ProgressSpinner onFinish={onFinish} />
      </SpinnerWrapper>
    </Overlay>
  )
}