import React from 'react';

const T: React.CSSProperties = { fontFamily: 'var(--font-display, sans-serif)', fontWeight: 700, letterSpacing: '0.04em' };
const M: React.CSSProperties = { fontFamily: 'var(--font-mono, monospace)' };

const C = {
  rel:    '#5b9bf9',
  nrel:   '#38d39b',
  linux:  '#f59e42',
  docker: '#a78bfa',
};

export default function HeroDiagram() {
  return (
    <svg
      viewBox="0 0 580 370"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block', borderRadius: 14 }}
      role="img"
      aria-label="Internals architecture — Relational DBs, Non-Relational DBs, Docker, Linux"
    >
      <defs>
        <filter id="glow-wire" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-cube" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-ambient" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="22"/>
        </filter>

        <linearGradient id="cube-top-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={C.rel}    stopOpacity="0.28"/>
          <stop offset="100%" stopColor={C.docker}  stopOpacity="0.18"/>
        </linearGradient>

        <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.9" fill="#1c2a3a" opacity="0.55"/>
        </pattern>
      </defs>

      {/* Background */}
      <rect width="580" height="370" rx="14" fill="#080a0d"/>
      <rect width="580" height="370" rx="14" fill="url(#dot-grid)"/>

      {/* Corner ambient glows — one per node */}
      <circle cx="99"  cy="80"  r="70" fill={C.rel}    opacity="0.09" filter="url(#glow-ambient)"/>
      <circle cx="99"  cy="285" r="70" fill={C.nrel}   opacity="0.07" filter="url(#glow-ambient)"/>
      <circle cx="481" cy="80"  r="70" fill={C.docker}  opacity="0.08" filter="url(#glow-ambient)"/>
      <circle cx="481" cy="285" r="70" fill={C.linux}   opacity="0.07" filter="url(#glow-ambient)"/>

      {/* ── CONNECTION WIRES ── */}
      {/* REL → cube left-top (215,178) */}
      <path d="M 180,78 H 215 V 178" fill="none" stroke={C.rel} strokeWidth="2.5" opacity="0.35" filter="url(#glow-wire)"/>
      <path d="M 180,78 H 215 V 178" fill="none" stroke={C.rel} strokeWidth="0.8" opacity="0.85"/>

      {/* NREL → cube left-bottom (215,248) */}
      <path d="M 180,285 H 215 V 248" fill="none" stroke={C.nrel} strokeWidth="2.5" opacity="0.3" filter="url(#glow-wire)"/>
      <path d="M 180,285 H 215 V 248" fill="none" stroke={C.nrel} strokeWidth="0.8" opacity="0.8"/>

      {/* Docker → cube right-top (345,178) */}
      <path d="M 400,78 H 345 V 178" fill="none" stroke={C.docker} strokeWidth="2.5" opacity="0.3" filter="url(#glow-wire)"/>
      <path d="M 400,78 H 345 V 178" fill="none" stroke={C.docker} strokeWidth="0.8" opacity="0.8"/>

      {/* Linux → cube right-bottom (345,248) */}
      <path d="M 400,285 H 345 V 248" fill="none" stroke={C.linux} strokeWidth="2.5" opacity="0.3" filter="url(#glow-wire)"/>
      <path d="M 400,285 H 345 V 248" fill="none" stroke={C.linux} strokeWidth="0.8" opacity="0.8"/>

      {/* Junction dots at cube vertices */}
      <circle cx="215" cy="178" r="4.5" fill={C.rel}    opacity="0.95" filter="url(#glow-wire)"/>
      <circle cx="215" cy="248" r="4.5" fill={C.nrel}   opacity="0.95" filter="url(#glow-wire)"/>
      <circle cx="345" cy="178" r="4.5" fill={C.docker}  opacity="0.95" filter="url(#glow-wire)"/>
      <circle cx="345" cy="248" r="4.5" fill={C.linux}   opacity="0.95" filter="url(#glow-wire)"/>

      {/* Traveling pulse dots */}
      <circle r="3" fill={C.rel}>
        <animateMotion dur="3s" repeatCount="indefinite" path="M 180,78 H 215 V 178"/>
        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle r="3" fill={C.nrel}>
        <animateMotion dur="3.6s" repeatCount="indefinite" begin="0.9s" path="M 180,285 H 215 V 248"/>
        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="3.6s" repeatCount="indefinite" begin="0.9s"/>
      </circle>
      <circle r="3" fill={C.docker}>
        <animateMotion dur="2.8s" repeatCount="indefinite" begin="1.4s" path="M 400,78 H 345 V 178"/>
        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.8s" repeatCount="indefinite" begin="1.4s"/>
      </circle>
      <circle r="3" fill={C.linux}>
        <animateMotion dur="4s" repeatCount="indefinite" begin="2s" path="M 400,285 H 345 V 248"/>
        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="4s" repeatCount="indefinite" begin="2s"/>
      </circle>

      {/* ── ISOMETRIC CUBE ──
           Top face:   (280,145) (345,178) (280,211) (215,178)
           Left face:  (215,178) (280,211) (280,281) (215,248)
           Right face: (345,178) (280,211) (280,281) (345,248)
      */}

      {/* Bloom glow behind cube */}
      <polygon points="280,145 345,178 280,211 215,178" fill={C.rel}    opacity="0.18" filter="url(#glow-cube)"/>
      <polygon points="215,178 280,211 280,281 215,248"  fill={C.rel}    opacity="0.07" filter="url(#glow-cube)"/>
      <polygon points="345,178 280,211 280,281 345,248"  fill={C.docker}  opacity="0.07" filter="url(#glow-cube)"/>

      {/* Left face — REL/NREL side */}
      <polygon points="215,178 280,211 280,281 215,248" fill="#0b1828" stroke={C.rel} strokeWidth="1" strokeOpacity="0.4"/>
      {/* Right face — Docker/Linux side */}
      <polygon points="345,178 280,211 280,281 345,248" fill="#110e1f" stroke={C.docker} strokeWidth="1" strokeOpacity="0.35"/>
      {/* Top face */}
      <polygon points="280,145 345,178 280,211 215,178" fill="url(#cube-top-grad)" stroke={C.rel} strokeWidth="1.5" strokeOpacity="0.65"/>
      {/* Top face glow edge */}
      <polygon points="280,145 345,178 280,211 215,178" fill="none" stroke={C.rel} strokeWidth="4" opacity="0.15" filter="url(#glow-cube)"/>

      {/* Cube center ridge */}
      <line x1="280" y1="211" x2="280" y2="281" stroke="#162030" strokeWidth="1" opacity="0.9"/>

      {/* Cube face labels */}
      <text x="248" y="196" style={T} fontSize="8" fill="#7aaee0" letterSpacing="0.16em" opacity="0.75">CORE</text>
      <text x="248" y="208" style={M} fontSize="7" fill="#4a7a60" letterSpacing="0.08em" opacity="0.6">internals</text>

      {/* ── NODE: Relational (top-left) ── */}
      <rect x="18" y="26" width="162" height="104" rx="10" fill="#0c1118"/>
      <rect x="18" y="26" width="162" height="104" rx="10" fill="none" stroke="#252e3d" strokeWidth="1"/>
      <rect x="18" y="26" width="162" height="104" rx="10" fill="none" stroke={C.rel} strokeWidth="1" strokeOpacity="0.28"/>
      <path d="M 18,40 V 26 H 32" fill="none" stroke={C.rel} strokeWidth="1.5" strokeOpacity="0.65"/>
      <path d="M 180,116 V 130 H 166" fill="none" stroke={C.rel} strokeWidth="1.5" strokeOpacity="0.3"/>
      <rect x="30" y="38" width="30" height="30" rx="6" fill="#0d1825" stroke={C.rel} strokeWidth="0.8" strokeOpacity="0.38"/>
      <rect x="34" y="43" width="22" height="4" rx="1" fill={C.rel} opacity="0.62"/>
      <line x1="34" y1="51" x2="56" y2="51" stroke="#1e3050" strokeWidth="0.8"/>
      <line x1="34" y1="59" x2="56" y2="59" stroke="#1e3050" strokeWidth="0.8"/>
      <line x1="45" y1="47" x2="45" y2="65" stroke="#1e3050" strokeWidth="0.8"/>
      <rect x="34" y="52" width="10" height="6" rx="0.5" fill={C.rel} opacity="0.22"/>
      <rect x="46" y="52" width="9"  height="6" rx="0.5" fill={C.rel} opacity="0.11"/>
      <rect x="34" y="60" width="10" height="4" rx="0.5" fill={C.rel} opacity="0.08"/>
      <rect x="146" y="38" width="26" height="16" rx="4" fill="#0d1825" stroke="#1e3050" strokeWidth="0.8"/>
      <text x="150" y="50" style={M} fontSize="9" fontWeight="bold" fill={C.rel}>SQL</text>
      <text x="70" y="54" style={T} fontSize="10.5" fill="#cccac8">RELATIONAL</text>
      <text x="70" y="67" style={T} fontSize="10.5" fill="#cccac8">DATABASES</text>
      <text x="30" y="113" style={M} fontSize="8.5" fill="#374555">PostgreSQL · tables · joins</text>

      {/* ── NODE: Non-Relational (bottom-left) ── */}
      <rect x="18" y="228" width="162" height="114" rx="10" fill="#0c1118"/>
      <rect x="18" y="228" width="162" height="114" rx="10" fill="none" stroke="#252e3d" strokeWidth="1"/>
      <rect x="18" y="228" width="162" height="114" rx="10" fill="none" stroke={C.nrel} strokeWidth="1" strokeOpacity="0.22"/>
      <path d="M 18,242 V 228 H 32" fill="none" stroke={C.nrel} strokeWidth="1.5" strokeOpacity="0.55"/>
      <path d="M 180,328 V 342 H 166" fill="none" stroke={C.nrel} strokeWidth="1.5" strokeOpacity="0.28"/>
      <rect x="30" y="242" width="30" height="30" rx="6" fill="#0c1e18" stroke={C.nrel} strokeWidth="0.8" strokeOpacity="0.38"/>
      <rect x="42" y="246" width="12" height="18" rx="2" fill="#081510" stroke={C.nrel} strokeWidth="0.7" strokeOpacity="0.3"/>
      <rect x="37" y="250" width="12" height="18" rx="2" fill={C.nrel} fillOpacity="0.09" stroke={C.nrel} strokeWidth="0.7" strokeOpacity="0.48"/>
      <line x1="40" y1="256" x2="46" y2="256" stroke={C.nrel} strokeWidth="0.7" opacity="0.48"/>
      <line x1="40" y1="260" x2="46" y2="260" stroke={C.nrel} strokeWidth="0.7" opacity="0.32"/>
      <line x1="40" y1="264" x2="44" y2="264" stroke={C.nrel} strokeWidth="0.7" opacity="0.18"/>
      <rect x="133" y="242" width="39" height="16" rx="4" fill="#0c1e18" stroke="#1e2d28" strokeWidth="0.8"/>
      <text x="137" y="254" style={M} fontSize="9" fontWeight="bold" fill={C.nrel}>NoSQL</text>
      <text x="70" y="258" style={T} fontSize="10.5" fill="#cccac8">NON-</text>
      <text x="70" y="271" style={T} fontSize="10.5" fill="#cccac8">RELATIONAL</text>
      <text x="70" y="284" style={T} fontSize="10.5" fill="#cccac8">DATABASES</text>
      <text x="30" y="324" style={M} fontSize="8.5" fill="#374555">MongoDB · Redis · key-value</text>

      {/* ── NODE: Docker (top-right) ── */}
      <rect x="400" y="26" width="162" height="104" rx="10" fill="#0c1118"/>
      <rect x="400" y="26" width="162" height="104" rx="10" fill="none" stroke="#252e3d" strokeWidth="1"/>
      <rect x="400" y="26" width="162" height="104" rx="10" fill="none" stroke={C.docker} strokeWidth="1" strokeOpacity="0.22"/>
      <path d="M 400,40 V 26 H 414" fill="none" stroke={C.docker} strokeWidth="1.5" strokeOpacity="0.6"/>
      <path d="M 562,116 V 130 H 548" fill="none" stroke={C.docker} strokeWidth="1.5" strokeOpacity="0.28"/>
      <rect x="412" y="38" width="30" height="30" rx="6" fill="#130e20" stroke={C.docker} strokeWidth="0.8" strokeOpacity="0.35"/>
      <rect x="416" y="42"   width="22" height="5.5" rx="1.5" fill={C.docker} opacity="0.58" stroke={C.docker} strokeWidth="0.5" strokeOpacity="0.6"/>
      <rect x="416" y="49.5" width="22" height="5.5" rx="1.5" fill={C.docker} opacity="0.35" stroke={C.docker} strokeWidth="0.5" strokeOpacity="0.4"/>
      <rect x="416" y="57"   width="22" height="5.5" rx="1.5" fill={C.docker} opacity="0.18" stroke={C.docker} strokeWidth="0.5" strokeOpacity="0.25"/>
      <text x="452" y="55" style={T} fontSize="13" fill="#cccac8">DOCKER</text>
      <text x="412" y="112" style={M} fontSize="8.5" fill="#374555">containers · images · compose</text>

      {/* ── NODE: Linux Commands (bottom-right) ── */}
      <rect x="400" y="228" width="162" height="104" rx="10" fill="#0c1118"/>
      <rect x="400" y="228" width="162" height="104" rx="10" fill="none" stroke="#252e3d" strokeWidth="1"/>
      <rect x="400" y="228" width="162" height="104" rx="10" fill="none" stroke={C.linux} strokeWidth="1" strokeOpacity="0.22"/>
      <path d="M 400,242 V 228 H 414" fill="none" stroke={C.linux} strokeWidth="1.5" strokeOpacity="0.55"/>
      <path d="M 562,318 V 332 H 548" fill="none" stroke={C.linux} strokeWidth="1.5" strokeOpacity="0.28"/>
      <rect x="412" y="242" width="30" height="30" rx="6" fill="#191106" stroke={C.linux} strokeWidth="0.8" strokeOpacity="0.35"/>
      <text x="415" y="263" style={M} fontSize="14" fontWeight="bold" fill="#d8d6d1">&gt;_</text>
      <text x="452" y="257" style={T} fontSize="12" fill="#cccac8">LINUX</text>
      <text x="452" y="272" style={T} fontSize="12" fill="#cccac8">COMMANDS</text>
      <text x="412" y="312" style={M} fontSize="8.5" fill="#374555">filesystem · processes · I/O</text>

      {/* Bottom label */}
      <text x="290" y="360" style={{ ...T, letterSpacing: '0.25em' }} fontSize="9" fill="#1e2830" textAnchor="middle">INTERNALS OVERVIEW</text>
    </svg>
  );
}
