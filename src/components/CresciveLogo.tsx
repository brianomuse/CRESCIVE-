import React, { useState } from "react";

interface CresciveLogoProps {
  className?: string;
  alt?: string;
  showGlow?: boolean;
  roundedClassName?: string;
}

/**
 * Official CRESCIVE Brand Logo Component
 * Uses the exact official CRESCIVE logo asset provided for the application.
 */
export const CresciveLogo: React.FC<CresciveLogoProps> = ({
  className = "w-8 h-8",
  alt = "Official CRESCIVE Logo",
  showGlow = true,
  roundedClassName = "rounded-xl",
}) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const candidatePaths = [
    "/crescive_logo.png",
    "/crescive-logo.png",
    "/crescive_pfp.png",
    "/logo.png",
    "/assets/crescive_logo.png",
  ];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${roundedClassName} overflow-hidden ${
        showGlow ? "shadow-[0_0_20px_rgba(0,229,255,0.35)]" : ""
      } ${className}`}
    >
      <img
        src={candidatePaths[srcIndex] || "/crescive_logo.png"}
        alt={alt}
        className="w-full h-full object-cover select-none pointer-events-none"
        referrerPolicy="no-referrer"
        loading="eager"
        onError={() => {
          if (srcIndex < candidatePaths.length - 1) {
            setSrcIndex((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};

export default CresciveLogo;
