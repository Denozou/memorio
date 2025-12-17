import { useMemo } from 'react';

/**
 * UTILITY: Random Number Generator
 * Seeded RNG to ensure consistent forest generation for each user.
 */
const mulberry32 = (a: number) => {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * COMPONENT: Isometric Tree
 */
const IsoTree = ({ x, y, type, color, scale, delay }: {
  x: number;
  y: number;
  type: number;
  color: string;
  scale: number;
  delay: number;
}) => {
  const style = {
    transformOrigin: 'bottom center',
    animation: `popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards ${delay}ms`,
    opacity: 0,
    transform: 'scale(0) translateY(10px)',
  };

  return (
    <g transform={`translate(${x}, ${y})`} style={{ isolation: 'isolate' }}>
      <g style={style} transform={`scale(${scale})`}>
        <ellipse cx="0" cy="0" rx="14" ry="6" fill="#064e3b" opacity="0.2" />
        <path d="M-3,-2 L-4,-15 L4,-15 L3,-2 Z" fill="#78350F" />
        {type === 0 && (
          <g transform="translate(0, -5)">
            <path d="M-12,-10 L0,-45 L12,-10 L0,-5 Z" fill={color} />
            <path d="M-12,-10 L0,-45 L0,-5 Z" fill="rgba(0,0,0,0.1)" />
          </g>
        )}
        {type === 1 && (
          <g transform="translate(0, -25)">
            <circle cx="-6" cy="4" r="10" fill={color} />
            <circle cx="6" cy="4" r="10" fill={color} />
            <circle cx="0" cy="-6" r="12" fill={color} />
            <circle cx="-3" cy="-10" r="4" fill="rgba(255,255,255,0.1)" />
          </g>
        )}
        {type === 2 && (
          <g transform="translate(0, -5)">
            <path d="M-8,-5 Q-12,-25 0,-35 Q12,-25 8,-5 Z" fill={color} />
            <path d="M0,-35 Q12,-25 8,-5 L0,-5 Z" fill="rgba(0,0,0,0.1)" />
          </g>
        )}
      </g>
    </g>
  );
};

/**
 * COMPONENT: Isometric Forest Island
 */
export const IsoForestPlot = ({ count, seedId, width = 300, height = 150, maxCapacity = 150, isInteractive = false }: {
  count: number;
  seedId: string;
  width?: number;
  height?: number;
  maxCapacity?: number;
  isInteractive?: boolean;
}) => {
  const trees = useMemo(() => {
    const generatedTrees = [];
    const numericSeed = seedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rng = mulberry32(numericSeed);
    const visualCount = Math.min(count, maxCapacity);

    const centerX = width / 2;
    const centerY = height * 0.55;
    const radiusX = width * 0.35;
    const radiusY = height * 0.25;

    for (let i = 0; i < visualCount; i++) {
      const r = Math.sqrt(rng());
      const theta = rng() * 2 * Math.PI;
      const x = centerX + (r * radiusX) * Math.cos(theta);
      const y = centerY + (r * radiusY) * Math.sin(theta);

      generatedTrees.push({
        id: i,
        x,
        y,
        type: Math.floor(rng() * 3),
        color: i % 5 === 0 ? '#4ade80' : i % 3 === 0 ? '#22c55e' : '#16a34a',
        scale: 0.7 + (rng() * 0.5),
        delay: i * 5
      });
    }

    return generatedTrees.sort((a, b) => a.y - b.y);
  }, [count, seedId, maxCapacity, width, height]);

  return (
    <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`w-full h-full drop-shadow-xl ${isInteractive ? 'scale-110 transition-transform duration-500' : ''}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${width / 2}, ${height / 2})`}>
          <ellipse cx="0" cy="12" rx={width * 0.45} ry={height * 0.35} fill="#78350F" />
          <ellipse cx="0" cy="0" rx={width * 0.45} ry={height * 0.35} fill="#86efac" stroke="#4ade80" strokeWidth="4" />
          <ellipse cx="0" cy="0" rx={width * 0.38} ry={height * 0.28} fill="#bbf7d0" opacity="0.3" />
        </g>
        {trees.map((tree) => (
          <IsoTree key={tree.id} {...tree} />
        ))}
      </svg>
    </div>
  );
};
