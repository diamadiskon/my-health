import React from 'react';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const moveUpAnimation = keyframes`
  0% {
    transform: translateY(100vh) rotate(0deg);
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
  }
`;

const BubbleContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
`;

const Bubble = styled.div<{ size: number; left: number; animationDuration: number; delay: number }>`
  position: absolute;
  bottom: -100px;
  background: rgba(46, 204, 113, 0.1);  // Light green color for health theme
  border: 1px solid rgba(46, 204, 113, 0.3);
  border-radius: 50%;
  animation: ${moveUpAnimation} ${props => props.animationDuration}s infinite linear;
  animation-delay: ${props => props.delay}s;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  left: ${props => props.left}%;
`;

export default function Bubbles() {
  const bubbles = Array.from({ length: 20 }, (_, i) => ({
    size: Math.random() * 60 + 20,
    left: Math.random() * 100,
    animationDuration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
  }));

  return (
    <BubbleContainer>
      {bubbles.map((bubble, index) => (
        <Bubble
          key={index}
          size={bubble.size}
          left={bubble.left}
          animationDuration={bubble.animationDuration}
          delay={bubble.delay}
        />
      ))}
    </BubbleContainer>
  );
}
