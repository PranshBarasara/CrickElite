"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Preparing Stadium...");
  const [isVisible, setIsVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const texts = [
    "Preparing Stadium...",
    "Loading Match Intelligence...",
    "Connecting Umpires...",
    "Synchronizing Score...",
    "Welcome to CrickVerse Elite"
  ];

  // Progress logic
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
              onComplete();
            }, 600); // Allow fadeout animation
          }, 400);
          return 100;
        }
        return next;
      });
    }, 20); // 2 seconds total

    return () => clearInterval(interval);
  }, []);

  // Text transition logic
  useEffect(() => {
    const textIdx = Math.min(Math.floor((progress / 100) * texts.length), texts.length - 1);
    setLoadingText(texts[textIdx]);
  }, [progress]);

  // 3D Cricket Ball canvas rendering
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let rotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 60;

      // Base Sphere Gradient (Red Cricket Ball)
      const ballGrad = ctx.createRadialGradient(
        cx - radius / 3,
        cy - radius / 3,
        2,
        cx,
        cy,
        radius
      );
      ballGrad.addColorStop(0, "#ff4d6d"); // Shiny highlights
      ballGrad.addColorStop(0.3, "#d90429"); // Standard dark red
      ballGrad.addColorStop(1, "#3a0007"); // Deep shadows

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.shadowBlur = 40;
      ctx.shadowColor = "rgba(255, 77, 109, 0.4)";
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Rotating Seam (white/gold thread overlay)
      rotation += 0.05;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      // We draw the seam as a curved ellipse running across the ball
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Draw seam ellipse
      ctx.ellipse(0, 0, radius, radius * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Seam Stitches (gold accents across the seam)
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Shiny specularity overlay (glass-like glare)
      const shineGrad = ctx.createLinearGradient(
        cx - radius,
        cy - radius,
        cx + radius,
        cy + radius
      );
      shineGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      shineGrad.addColorStop(0.5, "rgba(255, 255, 255, 0)");
      shineGrad.addColorStop(1, "rgba(0, 0, 0, 0.6)");

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = shineGrad;
      ctx.fill();

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.85, 0, 0.15, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] select-none"
        >
          {/* Animated Stadium Spotlight Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,200,255,0.08)_0%,transparent_60%)] pointer-events-none" />

          {/* Loader Wrapper */}
          <div className="relative flex flex-col items-center">
            {/* SVG Progress Ring */}
            <div className="absolute -top-10 flex items-center justify-center">
              <svg className="w-[180px] h-[180px] -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r="78"
                  className="stroke-white/5 fill-transparent"
                  strokeWidth="3"
                />
                {/* Dynamic Glowing Progress Ring */}
                <motion.circle
                  cx="90"
                  cy="90"
                  r="78"
                  className="stroke-emerald fill-transparent"
                  strokeWidth="4.5"
                  strokeDasharray={2 * Math.PI * 78}
                  strokeDashoffset={2 * Math.PI * 78 * (1 - progress / 100)}
                  strokeLinecap="round"
                  style={{
                    filter: "drop-shadow(0 0 10px rgba(0, 255, 178, 0.6))",
                  }}
                />
              </svg>
            </div>

            {/* Rotating 3D-Canvas Cricket Ball */}
            <div className="w-[180px] h-[180px] flex items-center justify-center relative z-10">
              <canvas
                ref={canvasRef}
                width="160"
                height="160"
                className="w-[160px] h-[160px]"
              />
            </div>

            {/* Premium Logo Animation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-center"
            >
              <h1 className="font-space text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center justify-center gap-1">
                CRICK<span className="text-gold font-light">ELITE</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-blue mt-2 font-mono">
                THE FUTURE OF DIGITAL CRICKET
              </p>
            </motion.div>

            {/* Progress Percentage Display */}
            <div className="mt-6 text-center font-sora text-sm text-text-secondary w-40 flex flex-col items-center">
              <span className="text-2xl font-bold text-white mb-2">{progress}%</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={loadingText}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs tracking-wider whitespace-nowrap text-text-secondary h-4"
                >
                  {loadingText}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
