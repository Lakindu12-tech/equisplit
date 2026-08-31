import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface SpatialCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  glowColor?: string;
  onClick?: () => void;
}

export const SpatialCard: React.FC<SpatialCardProps> = ({
  children,
  className = '',
  depth = 24,
  glowColor = 'rgba(16, 185, 129, 0.15)',
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice(window.matchMedia('(hover: none)').matches || 'ontouchstart' in window);
    }
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handlePointerEnter = () => {
    if (!isTouchDevice) setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  if (isTouchDevice) {
    return (
      <div 
        className={`gpu-accel transition-transform active:scale-[0.98] ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{ perspective: 1000 }}
      className="relative block"
    >
      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={onClick}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={`relative overflow-hidden gpu-accel transition-shadow duration-300 ${className} ${
          isHovered ? 'shadow-2xl' : ''
        }`}
      >
        {/* Dynamic Specular Glare Layer */}
        {isHovered && (
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, ${glowColor}, transparent 65%)`,
            }}
            className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          />
        )}

        {/* Floating Content Layer */}
        <div style={{ transform: `translateZ(${depth}px)` }} className="relative z-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
