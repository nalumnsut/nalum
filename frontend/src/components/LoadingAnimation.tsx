import { useEffect, useRef, useState } from "react";

interface LoadingAnimationProps {
  onAnimationComplete?: () => void;
}

export function LoadingAnimation({
  onAnimationComplete,
}: LoadingAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  // When the video ends, start the fade-out
  const handleVideoEnd = () => {
    setFadingOut(true);
  };

  // When the CSS fade-out transition finishes, remove the overlay
  const handleTransitionEnd = () => {
    if (fadingOut) {
      setHidden(true);
      onAnimationComplete?.();
    }
  };

  // Safety fallback: if video fails to load, skip after 2s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fadingOut && !hidden) {
        setFadingOut(true);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [fadingOut, hidden]);

  if (hidden) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        paddingLeft: window.innerWidth >= 768 ? "8%" : "0",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: fadingOut ? "none" : "auto",
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        style={{
          width: "100%",
          objectFit: "contain",
        }}
      >
        <source src="/animation/intro.mp4" type="video/mp4" />
      </video>
    </div>
  );
}