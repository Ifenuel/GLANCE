"use client";

import { useEffect, useRef, useState } from "react";

export type NetworkNode = {
  id: string;
  label: string;
  city: string;
  code: string;
};

/**
 * The chapter network as a signature visual: real chapters plotted as nodes
 * around the GLANCE hub, with connecting lines that draw themselves as the
 * band scrolls into view. Nodes are interactive — hover or press one and it
 * surfaces its institution; every node is also a link to that chapter's page.
 *
 * Layout is deterministic (a hub-and-satellite ring), so the server and
 * client render the same geometry with no layout shift. Reduced-motion
 * visitors get the finished drawing, fully visible.
 */
export function ChapterNetwork({ nodes }: { nodes: NetworkNode[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      svg.classList.add("net-drawn");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            // Draw the mesh, then light the nodes, then invite.
            window.setTimeout(() => svg.classList.add("net-drawn"), 200);
            return;
          }
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, [nodes.length]);

  // Hub-and-satellite ring around the GLANCE hub.
  const hub = { x: 400, y: 185 };
  const positions = nodes.map((_, index) => {
    const angle = -Math.PI / 2 + (index / nodes.length) * Math.PI * 2;
    const radiusX = 315;
    const radiusY = 128;
    return {
      x: hub.x + Math.cos(angle) * radiusX,
      y: hub.y + Math.sin(angle) * radiusY,
    };
  });

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox="0 0 800 370"
        role="img"
        aria-label={`The GLANCE network: ${nodes.length} connected chapters around one hub.`}
        className="net-band h-auto w-full"
      >
        <defs>
          <radialGradient id="net-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EAAE14" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#EAAE14" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Link mesh */}
        <g className="net-links">
          {positions.map((p, i) => {
            const midX = (hub.x + p.x) / 2;
            const midY =
              (hub.y + p.y) / 2 + (i % 2 === 0 ? 34 : -34);
            const d = `M ${hub.x} ${hub.y} Q ${midX} ${midY} ${p.x} ${p.y}`;
            return (
              <path
                key={nodes[i].id}
                d={d}
                pathLength={1}
                fill="none"
                stroke="rgba(234,174,20,0.55)"
                strokeWidth="1.4"
                className="net-link"
                style={{ ["--net-delay" as never]: `${i * 0.18}s` }}
              />
            );
          })}
        </g>

        {/* Hub */}
        <circle cx={hub.x} cy={hub.y} r="58" fill="url(#net-glow)" opacity="0.5" />
        <g className="net-hub">
          <circle cx={hub.x} cy={hub.y} r="34" className="net-hub__ring" />
          <text x={hub.x} y={hub.y + 5} textAnchor="middle" className="net-hub__text">
            GLANCE
          </text>
        </g>

        {/* Chapter nodes */}
        {positions.map((p, i) => (
          <g
            key={nodes[i].id}
            className={`net-node ${active === i ? "is-active" : ""}`}
            tabIndex={0}
            role="link"
            aria-label={`${nodes[i].label} chapter — open its page`}
            style={{ ["--net-node-delay" as never]: `${0.55 + i * 0.14}s` }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(-1)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(-1)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                window.location.href = `/chapters/${nodes[i].code}`;
              }
            }}
          >
            <a href={`/chapters/${nodes[i].code}`} aria-label={undefined} tabIndex={-1}>
              <circle cx={p.x} cy={p.y} r="7" className="net-node__dot" />
              <circle cx={p.x} cy={p.y} r="14" className="net-node__pulse" />
            </a>
            <text
              x={p.x}
              y={p.y > hub.y + 30 ? p.y + 30 : p.y - 24}
              textAnchor="middle"
              className="net-node__label"
            >
              {nodes[i].label}
            </text>
            <text
              x={p.x}
              y={p.y > hub.y + 30 ? p.y + 46 : p.y - 10}
              textAnchor="middle"
              className="net-node__city"
            >
              {nodes[i].city}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
