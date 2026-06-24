const T: React.CSSProperties = { fontFamily: 'var(--font-display, sans-serif)', fontWeight: 700, letterSpacing: '0.04em' };
const M: React.CSSProperties = { fontFamily: 'var(--font-mono, monospace)' };

import React from 'react';

export default function HeroDiagram() {
  return (
    <svg
      viewBox="0 0 560 330"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block', borderRadius: 14 }}
      role="img"
      aria-label="Internals system overview — Relational DBs, Non-Relational DBs, Docker, Linux"
    >
      <defs>
        <linearGradient id="hd-bus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b9bf9" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#38d39b" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="560" height="330" rx="14" fill="#090a0d" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* ── Mesh lines ── */}
      <g stroke="#233040" strokeWidth="0.7" fill="none" opacity="0.55">
        <line x1="142" y1="15"  x2="282" y2="10" />
        <line x1="282" y1="10"  x2="424" y2="22" />
        <line x1="424" y1="22"  x2="512" y2="65" />
        <line x1="512" y1="65"  x2="532" y2="142" />
        <line x1="532" y1="142" x2="520" y2="214" />
        <line x1="520" y1="214" x2="490" y2="278" />
        <line x1="490" y1="278" x2="390" y2="308" />
        <line x1="390" y1="308" x2="268" y2="312" />
        <line x1="268" y1="312" x2="148" y2="300" />
        <line x1="148" y1="300" x2="64"  y2="260" />
        <line x1="64"  y1="260" x2="28"  y2="194" />
        <line x1="28"  y1="194" x2="32"  y2="118" />
        <line x1="32"  y1="118" x2="74"  y2="58" />
        <line x1="74"  y1="58"  x2="142" y2="15" />
        <line x1="282" y1="10"  x2="254" y2="160" />
        <line x1="424" y1="22"  x2="532" y2="142" />
        <line x1="512" y1="65"  x2="254" y2="160" />
        <line x1="532" y1="142" x2="254" y2="160" />
        <line x1="520" y1="214" x2="296" y2="248" />
        <line x1="490" y1="278" x2="296" y2="248" />
        <line x1="268" y1="312" x2="296" y2="248" />
        <line x1="64"  y1="260" x2="254" y2="160" />
        <line x1="28"  y1="194" x2="254" y2="160" />
        <line x1="74"  y1="58"  x2="254" y2="160" />
        <line x1="254" y1="160" x2="296" y2="248" />
        <line x1="148" y1="300" x2="296" y2="248" />
        <line x1="32"  y1="118" x2="254" y2="160" />
      </g>

      {/* Mesh dots */}
      <g fill="#344455" opacity="0.6">
        {[
          [142,15],[282,10],[424,22],[512,65],[532,142],
          [520,214],[490,278],[390,308],[268,312],[148,300],
          [64,260],[28,194],[32,118],[74,58],[254,160],[296,248],
        ].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="2.5"/>)}
      </g>

      {/* Pulsing accent dots */}
      <circle cx="282" cy="10" r="4.5" fill="#5b9bf9" opacity="0.65">
        <animate attributeName="opacity" values="0.65;0.2;0.65" dur="3.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="268" cy="312" r="4.5" fill="#38d39b" opacity="0.65">
        <animate attributeName="opacity" values="0.65;0.2;0.65" dur="4s" repeatCount="indefinite" begin="1s"/>
      </circle>
      <circle cx="532" cy="142" r="3.5" fill="#5b9bf9" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" begin="0.5s"/>
      </circle>
      <circle cx="490" cy="278" r="3.5" fill="#38d39b" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3.2s" repeatCount="indefinite" begin="1.5s"/>
      </circle>

      {/* ── Connector bus ── */}
      <line x1="226" y1="90"  x2="278" y2="90"  stroke="#5b9bf9"         strokeWidth="1.5" opacity="0.8" />
      <line x1="226" y1="236" x2="278" y2="236" stroke="#38d39b"         strokeWidth="1.5" opacity="0.8" />
      <line x1="278" y1="90"  x2="278" y2="236" stroke="url(#hd-bus)"    strokeWidth="1.5" opacity="0.8" />
      <line x1="278" y1="106" x2="332" y2="106" stroke="#5b9bf9"         strokeWidth="1.5" opacity="0.8" />
      <line x1="278" y1="220" x2="332" y2="220" stroke="#38d39b"         strokeWidth="1.5" opacity="0.8" />

      {/* Junction dots */}
      <circle cx="278" cy="90"  r="3.5" fill="#5b9bf9" opacity="0.95" />
      <circle cx="278" cy="106" r="3"   fill="#5b9bf9" opacity="0.65" />
      <circle cx="278" cy="220" r="3"   fill="#38d39b" opacity="0.65" />
      <circle cx="278" cy="236" r="3.5" fill="#38d39b" opacity="0.95" />

      {/* ── NODE: Relational Databases ── */}
      <rect x="22" y="44" width="204" height="104" rx="10" fill="#11141a" stroke="#252a30" strokeWidth="1" />
      {/* icon */}
      <rect x="34" y="57" width="32" height="32" rx="7" fill="#191d24" />
      <rect x="38" y="62" width="24" height="4"  rx="1" fill="#5b9bf9" opacity="0.55" />
      <line x1="38" y1="70" x2="62" y2="70" stroke="#2d3540" strokeWidth="0.8" />
      <line x1="38" y1="78" x2="62" y2="78" stroke="#2d3540" strokeWidth="0.8" />
      <line x1="50" y1="66" x2="50" y2="86" stroke="#2d3540" strokeWidth="0.8" />
      <rect x="38" y="71" width="11" height="6" rx="1" fill="#5b9bf9" opacity="0.28" />
      <rect x="51" y="71" width="10" height="6" rx="1" fill="#5b9bf9" opacity="0.16" />
      <rect x="38" y="79" width="11" height="6" rx="1" fill="#5b9bf9" opacity="0.12" />
      <rect x="51" y="79" width="10" height="6" rx="1" fill="#5b9bf9" opacity="0.08" />
      {/* SQL badge */}
      <rect x="176" y="57" width="36" height="20" rx="5" fill="#191d24" stroke="#252a30" strokeWidth="1" />
      <text x="183" y="71" style={M} fontSize="10" fontWeight="bold" fill="#5b9bf9">SQL</text>
      {/* labels */}
      <text x="76" y="72" style={T} fontSize="11.5" fill="#e8e6e1">RELATIONAL</text>
      <text x="76" y="87" style={T} fontSize="11.5" fill="#e8e6e1">DATABASES</text>
      <text x="34" y="133" style={M} fontSize="9.5" fill="#545e6a">PostgreSQL · tables · joins</text>

      {/* ── NODE: Non-Relational Databases ── */}
      <rect x="22" y="170" width="204" height="120" rx="10" fill="#11141a" stroke="#252a30" strokeWidth="1" />
      {/* icon */}
      <rect x="34" y="183" width="32" height="32" rx="7" fill="#191d24" />
      <rect x="44" y="186" width="16" height="22" rx="2" fill="#191d24" stroke="#38d39b" strokeWidth="0.8" strokeOpacity="0.3" />
      <rect x="39" y="190" width="16" height="22" rx="2" fill="#38d39b" fillOpacity="0.1" stroke="#38d39b" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="42" y1="196" x2="52" y2="196" stroke="#38d39b" strokeWidth="0.8" opacity="0.55" />
      <line x1="42" y1="200" x2="52" y2="200" stroke="#38d39b" strokeWidth="0.8" opacity="0.38" />
      <line x1="42" y1="204" x2="49" y2="204" stroke="#38d39b" strokeWidth="0.8" opacity="0.22" />
      {/* NoSQL badge */}
      <rect x="165" y="183" width="47" height="20" rx="5" fill="#191d24" stroke="#252a30" strokeWidth="1" />
      <text x="171" y="197" style={M} fontSize="10" fontWeight="bold" fill="#38d39b">NoSQL</text>
      {/* labels */}
      <text x="76" y="199" style={T} fontSize="11.5" fill="#e8e6e1">NON-</text>
      <text x="76" y="214" style={T} fontSize="11.5" fill="#e8e6e1">RELATIONAL</text>
      <text x="76" y="229" style={T} fontSize="11.5" fill="#e8e6e1">DATABASES</text>
      <text x="34" y="272" style={M} fontSize="9.5" fill="#545e6a">MongoDB · Redis · key-value</text>

      {/* ── NODE: Docker ── */}
      <rect x="332" y="58" width="190" height="88" rx="10" fill="#11141a" stroke="#252a30" strokeWidth="1" />
      {/* icon */}
      <rect x="344" y="71" width="32" height="32" rx="7" fill="#191d24" />
      <rect x="348" y="75"   width="24" height="5.5" rx="1.5" fill="#38d39b" opacity="0.48" stroke="#38d39b" strokeWidth="0.6" strokeOpacity="0.55" />
      <rect x="348" y="82.5" width="24" height="5.5" rx="1.5" fill="#38d39b" opacity="0.3"  stroke="#38d39b" strokeWidth="0.6" strokeOpacity="0.38" />
      <rect x="348" y="90"   width="24" height="5.5" rx="1.5" fill="#38d39b" opacity="0.16" stroke="#38d39b" strokeWidth="0.6" strokeOpacity="0.24" />
      {/* labels */}
      <text x="386" y="90" style={T} fontSize="14" fill="#e8e6e1">DOCKER</text>
      <text x="344" y="128" style={M} fontSize="9.5" fill="#545e6a">containers · orchestration</text>

      {/* ── NODE: Linux Commands ── */}
      <rect x="332" y="174" width="190" height="88" rx="10" fill="#11141a" stroke="#252a30" strokeWidth="1" />
      {/* icon */}
      <rect x="344" y="187" width="32" height="32" rx="7" fill="#191d24" />
      <text x="348" y="208" style={M} fontSize="14" fontWeight="bold" fill="#e8e6e1">&gt;_</text>
      {/* labels */}
      <text x="386" y="202" style={T} fontSize="13" fill="#e8e6e1">LINUX</text>
      <text x="386" y="218" style={T} fontSize="13" fill="#e8e6e1">COMMANDS</text>
      <text x="344" y="244" style={M} fontSize="9.5" fill="#545e6a">filesystem · processes · I/O</text>

      {/* ── Bottom label ── */}
      <text x="280" y="320" style={{ ...T, letterSpacing: '0.28em' }} fontSize="10" fill="#222830" textAnchor="middle">INTERNALS OVERVIEW</text>
    </svg>
  );
}
