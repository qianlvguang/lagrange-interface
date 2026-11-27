import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-[#F8F6F1]"
    >
      {/* Top-right Claude Terracotta aura */}
      <div
        className="absolute -top-36 -right-24 w-[620px] h-[620px] rounded-full blur-3xl animate-drift-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(217, 119, 87, 0.19) 0%, rgba(217, 119, 87, 0.04) 55%, transparent 75%)',
        }}
      />
      {/* Top-left warm sand gold */}
      <div
        className="absolute -top-20 -left-32 w-[560px] h-[560px] rounded-full blur-3xl animate-drift-reverse"
        style={{
          background:
            'radial-gradient(circle, rgba(229, 193, 133, 0.22) 0%, rgba(229, 193, 133, 0.05) 55%, transparent 76%)',
        }}
      />
      {/* Bottom-center sage mist */}
      <div
        className="absolute -bottom-44 left-1/3 w-[680px] h-[540px] rounded-full blur-3xl animate-drift-slow"
        style={{
          background:
            'radial-gradient(circle, rgba(116, 168, 146, 0.14) 0%, rgba(116, 168, 146, 0.03) 55%, transparent 76%)',
        }}
      />

      {/* Fine frosted grain overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.028]">
        <filter id="lagrange-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#lagrange-noise)" />
      </svg>
    </div>
  );
};
