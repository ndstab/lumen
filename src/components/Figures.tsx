import type { ReactNode } from "react";

/**
 * Hand-built lesson diagrams.
 *
 * Every figure is drawn to correct geometry rather than sketched: the ray
 * diagrams use real construction rays, the graph axes carry real values, and
 * the scale bar is genuinely logarithmic. Colours come from the shared .dgm
 * classes in globals.css so the figures inherit the palette.
 */

function ArrowDefs() {
  return (
    <defs>
      <marker
        id="ah-ink"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" fill="var(--ink)" />
      </marker>
      <marker
        id="ah-blue"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
      </marker>
      <marker
        id="ah-orange"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" fill="var(--accent-2-ink)" />
      </marker>
      <pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ink)" strokeWidth="1.5" opacity="0.45" />
      </pattern>
    </defs>
  );
}

/* ------------------------------------------------------------------ light -- */

function ReflectionLaw() {
  return (
    <svg viewBox="0 0 480 230" className="dgm" role="img"
      aria-label="A ray striking a plane mirror, with the normal drawn and the angle of incidence equal to the angle of reflection.">
      <ArrowDefs />
      {/* mirror */}
      <line className="thick" x1="60" y1="180" x2="420" y2="180" />
      <rect x="60" y="180" width="360" height="12" fill="url(#hatch)" />
      {/* normal */}
      <line className="axis" x1="240" y1="34" x2="240" y2="180" />
      {/* incident and reflected rays */}
      <line className="beam" x1="96" y1="62" x2="240" y2="180" markerEnd="url(#ah-blue)" />
      <line className="mark" x1="240" y1="180" x2="384" y2="62" markerEnd="url(#ah-orange)" />
      {/* angle arcs */}
      <path d="M240 130 A 50 50 0 0 0 205 145" className="beam" strokeWidth="1.5" />
      <path d="M240 130 A 50 50 0 0 1 275 145" className="mark" strokeWidth="1.5" />
      <text className="cool" x="196" y="124">i</text>
      <text className="hot" x="276" y="124">r</text>
      <text x="248" y="46">normal</text>
      <text x="352" y="208">mirror</text>
      <text className="cool" x="72" y="52">incident</text>
      <text className="hot" x="330" y="52">reflected</text>
    </svg>
  );
}

function PlaneMirror() {
  return (
    <svg viewBox="0 0 480 250" className="dgm" role="img"
      aria-label="An object in front of a plane mirror and its virtual image the same distance behind, located by extending the reflected rays backwards.">
      <ArrowDefs />
      {/* mirror plane */}
      <line className="thick" x1="240" y1="24" x2="240" y2="226" />
      <rect x="240" y="24" width="12" height="202" fill="url(#hatch)" />
      {/* object */}
      <line className="thick" x1="120" y1="180" x2="120" y2="96" markerEnd="url(#ah-ink)" />
      <text x="86" y="200">object</text>
      {/* two rays from the object tip to the mirror, then reflected to the eye */}
      <line className="beam" x1="120" y1="96" x2="240" y2="70" />
      <line className="beam" x1="240" y1="70" x2="120" y2="44" markerEnd="url(#ah-blue)" />
      <line className="beam" x1="120" y1="96" x2="240" y2="140" />
      <line className="beam" x1="240" y1="140" x2="120" y2="186" markerEnd="url(#ah-blue)" />
      {/* backward extensions meeting at the virtual image */}
      <line className="mark" strokeDasharray="6 5" x1="240" y1="70" x2="360" y2="96" />
      <line className="mark" strokeDasharray="6 5" x1="240" y1="140" x2="360" y2="96" />
      {/* virtual image */}
      <line className="mark" strokeDasharray="6 5" x1="360" y1="180" x2="360" y2="96" markerEnd="url(#ah-orange)" />
      <text className="hot" x="376" y="200">image</text>
      {/* equal distances */}
      <line className="axis" x1="120" y1="212" x2="240" y2="212" />
      <line className="axis" x1="240" y1="212" x2="360" y2="212" />
      <text x="160" y="236">d</text>
      <text x="292" y="236">d</text>
    </svg>
  );
}

function RefractionSlab() {
  return (
    <svg viewBox="0 0 480 240" className="dgm" role="img"
      aria-label="A ray entering a glass slab bends towards the normal, and on leaving bends away again, emerging parallel to its original direction but displaced sideways.">
      <ArrowDefs />
      {/* slab */}
      <rect className="solid fill-wash" x="140" y="80" width="220" height="90" />
      <text x="286" y="128">glass</text>
      {/* normals at the two faces */}
      <line className="axis" x1="200" y1="42" x2="200" y2="118" />
      <line className="axis" x1="236" y1="132" x2="236" y2="208" />
      {/* incident ray */}
      <line className="beam" x1="128" y1="20" x2="200" y2="80" markerEnd="url(#ah-blue)" />
      {/* inside the slab, bent towards the normal */}
      <line className="beam" x1="200" y1="80" x2="236" y2="170" />
      {/* emergent ray, parallel to the incident ray */}
      <line className="beam" x1="236" y1="170" x2="308" y2="230" markerEnd="url(#ah-blue)" />
      {/* dashed original direction, showing the lateral shift */}
      <line className="mark" strokeDasharray="6 5" x1="200" y1="80" x2="380" y2="230" />
      <text className="hot" x="386" y="222">original</text>
      <text className="hot" x="386" y="240">direction</text>
      <text className="cool" x="96" y="36">incident</text>
      <text x="206" y="60">normal</text>
    </svg>
  );
}

function ConvexLens() {
  return (
    <svg viewBox="0 0 480 210" className="dgm" role="img"
      aria-label="Ray diagram for a convex lens with the object at twice the focal length. The parallel ray refracts through the far focus, the central ray passes straight through, and they meet at 2F on the far side.">
      <ArrowDefs />
      <line className="axis" x1="18" y1="112" x2="462" y2="112" />
      <ellipse className="solid fill-wash" cx="240" cy="112" rx="12" ry="74" />
      <line className="tick" x1="170" y1="106" x2="170" y2="118" />
      <line className="tick" x1="310" y1="106" x2="310" y2="118" />
      <line className="tick" x1="100" y1="106" x2="100" y2="118" />
      <line className="tick" x1="380" y1="106" x2="380" y2="118" />
      <text x="164" y="134">F</text>
      <text x="300" y="134">F&#8242;</text>
      <text x="88" y="134">2F</text>
      <text x="392" y="134">2F&#8242;</text>
      {/* object */}
      <line className="thick" x1="100" y1="112" x2="100" y2="52" markerEnd="url(#ah-ink)" />
      <text x="58" y="44">object</text>
      {/* the two construction rays */}
      <path className="beam" d="M100 52 H240 L380 172" />
      <path className="beam" d="M100 52 L380 172" />
      {/* image */}
      <line className="mark" x1="380" y1="112" x2="380" y2="172" markerEnd="url(#ah-orange)" />
      <text className="hot" x="394" y="184">image</text>
    </svg>
  );
}

function HumanEye() {
  return (
    <svg viewBox="0 0 480 300" className="dgm" role="img"
      aria-label="A horizontal section through the eye showing the cornea, iris, pupil, lens, retina and optic nerve.">
      <ArrowDefs />
      {/* eyeball */}
      <circle className="solid fill-paper" cx="250" cy="150" r="106" />
      {/* cornea bulge at the front */}
      <path className="solid fill-wash" d="M152 108 A 62 62 0 0 0 152 192 A 92 92 0 0 1 152 108 Z" />
      {/* iris, top and bottom, leaving the pupil open */}
      <line className="thick" x1="170" y1="104" x2="176" y2="128" />
      <line className="thick" x1="170" y1="196" x2="176" y2="172" />
      {/* lens */}
      <ellipse className="solid fill-wash" cx="196" cy="150" rx="16" ry="40" />
      {/* retina, the inner back surface */}
      <path className="mark" d="M330 88 A 92 92 0 0 1 330 212" strokeWidth="4" />
      <text className="hot" x="348" y="150">retina</text>
      {/* optic nerve */}
      <path className="solid fill-paper" d="M340 176 L406 208 L396 232 L330 200 Z" />
      <text x="352" y="256">optic nerve</text>
      {/* incoming rays converging on the retina */}
      <path className="beam" d="M40 92 L166 128 L336 146" />
      <path className="beam" d="M40 208 L166 172 L336 154" />
      {/* labels */}
      <text x="120" y="72">cornea</text>
      <line className="tick" x1="150" y1="80" x2="162" y2="112" />
      <text x="186" y="248">lens</text>
      <line className="tick" x1="198" y1="236" x2="198" y2="192" />
      <text x="128" y="284">pupil</text>
      <line className="tick" x1="156" y1="272" x2="172" y2="160" />
      <text x="212" y="42">iris</text>
      <line className="tick" x1="212" y1="50" x2="176" y2="100" />
    </svg>
  );
}

/* ------------------------------------------------------------------- cell -- */

function AnimalCell() {
  return (
    <svg viewBox="0 0 480 300" className="dgm" role="img"
      aria-label="An animal cell in section, with the plasma membrane, cytoplasm, nucleus, nucleolus, mitochondria, endoplasmic reticulum, Golgi apparatus and vacuoles labelled.">
      {/* membrane */}
      <path className="thick fill-wash"
        d="M62 150 C62 84 128 44 216 44 C310 44 386 78 400 140 C412 196 366 258 268 262 C160 266 62 224 62 150 Z" />
      {/* nucleus */}
      <circle className="solid fill-paper" cx="212" cy="146" r="52" />
      <circle className="fill-orange" cx="224" cy="138" r="14" />
      <text x="186" y="152">nucleus</text>
      {/* mitochondria */}
      <g>
        <ellipse className="solid fill-paper" cx="322" cy="98" rx="34" ry="17" transform="rotate(-18 322 98)" />
        <path className="mark" strokeWidth="1.5" d="M300 100 q8 -10 16 0 q8 10 16 0 q8 -10 14 0" transform="rotate(-18 322 98)" />
        <ellipse className="solid fill-paper" cx="132" cy="214" rx="30" ry="15" transform="rotate(12 132 214)" />
        <path className="mark" strokeWidth="1.5" d="M112 216 q7 -9 14 0 q7 9 14 0 q6 -9 12 0" transform="rotate(12 132 214)" />
      </g>
      {/* endoplasmic reticulum with ribosomes */}
      <g>
        <path className="solid" d="M118 96 q26 -14 52 2 q26 16 50 -2" />
        <path className="solid" d="M114 116 q26 -14 52 2 q26 16 50 -2" />
        <g className="fill-ink">
          <circle cx="130" cy="92" r="3" /><circle cx="158" cy="98" r="3" />
          <circle cx="186" cy="100" r="3" /><circle cx="212" cy="92" r="3" />
          <circle cx="126" cy="112" r="3" /><circle cx="154" cy="118" r="3" />
        </g>
      </g>
      {/* golgi */}
      <g className="solid">
        <path d="M292 194 q30 -12 56 0" />
        <path d="M290 206 q30 -12 56 0" />
        <path d="M288 218 q30 -12 56 0" />
      </g>
      {/* vacuoles */}
      <circle className="solid fill-paper" cx="238" cy="224" r="16" />
      <circle className="solid fill-paper" cx="192" cy="240" r="11" />

      {/* labels with leader lines */}
      <text x="8" y="126">membrane</text>
      <line className="tick" x1="62" y1="134" x2="76" y2="146" />
      <text x="98" y="70">endoplasmic</text>
      <line className="tick" x1="132" y1="78" x2="140" y2="90" />
      <text x="378" y="60">mitochondrion</text>
      <line className="tick" x1="376" y1="68" x2="344" y2="86" />
      <text x="366" y="242">Golgi</text>
      <line className="tick" x1="364" y1="234" x2="342" y2="212" />
      <text x="228" y="292">vacuole</text>
      <line className="tick" x1="244" y1="280" x2="240" y2="242" />
    </svg>
  );
}

function PlantCell() {
  return (
    <svg viewBox="0 0 480 300" className="dgm" role="img"
      aria-label="A plant cell showing the rigid cell wall outside the plasma membrane, a large central vacuole, chloroplasts and a nucleus pushed to the side.">
      {/* cell wall, drawn as a double line to show it is a separate rigid layer */}
      <rect className="thick fill-paper" x="46" y="40" width="388" height="222" />
      <rect className="solid fill-wash" x="60" y="54" width="360" height="194" />
      {/* central vacuole */}
      <rect className="solid fill-paper" x="122" y="92" width="238" height="120" />
      <text x="196" y="158">central vacuole</text>
      {/* nucleus pushed to the edge */}
      <circle className="solid fill-paper" cx="92" cy="180" r="30" />
      <circle className="fill-orange" cx="98" cy="174" r="9" />
      {/* chloroplasts */}
      <g>
        <ellipse cx="150" cy="72" rx="21" ry="11" fill="var(--ok-wash)" stroke="var(--ok)" strokeWidth="2" />
        <ellipse cx="238" cy="230" rx="21" ry="11" fill="var(--ok-wash)" stroke="var(--ok)" strokeWidth="2" />
        <ellipse cx="376" cy="88" rx="21" ry="11" fill="var(--ok-wash)" stroke="var(--ok)" strokeWidth="2" />
        <ellipse cx="392" cy="196" rx="21" ry="11" fill="var(--ok-wash)" stroke="var(--ok)" strokeWidth="2" />
      </g>
      {/* mitochondrion, present in plant cells too */}
      <ellipse className="solid fill-paper" cx="96" cy="98" rx="26" ry="13" />

      {/* labels */}
      <text x="8" y="30">cell wall</text>
      <line className="tick" x1="52" y1="34" x2="52" y2="44" />
      <text x="290" y="30">plasma membrane</text>
      <line className="tick" x1="330" y1="34" x2="330" y2="56" />
      <text x="106" y="286">nucleus</text>
      <line className="tick" x1="112" y1="274" x2="100" y2="212" />
      <text x="196" y="286">chloroplast</text>
      <line className="tick" x1="236" y1="274" x2="238" y2="244" />
      <text x="376" y="286">mitochondrion</text>
      <line className="tick" x1="392" y1="274" x2="110" y2="112" opacity="0.25" />
    </svg>
  );
}

function CellScale() {
  // Genuinely logarithmic: each labelled decade is evenly spaced.
  const decades = [
    { x: 40, label: "0.1 um" },
    { x: 110, label: "1 um" },
    { x: 180, label: "10 um" },
    { x: 250, label: "100 um" },
    { x: 320, label: "1 mm" },
    { x: 390, label: "1 cm" },
    { x: 440, label: "10 cm" },
  ];
  const marks = [
    { x: 58, label: "Mycoplasma", y: 44 },
    { x: 124, label: "bacterium", y: 74 },
    { x: 165, label: "red blood cell", y: 44 },
    { x: 250, label: "human egg", y: 74 },
    { x: 448, label: "ostrich yolk", y: 44 },
  ];

  return (
    <svg viewBox="0 0 480 170" className="dgm" role="img"
      aria-label="A logarithmic scale of cell sizes from Mycoplasma at 0.3 micrometres to the ostrich egg yolk at 15 centimetres.">
      <line className="thick" x1="30" y1="110" x2="460" y2="110" />
      {decades.map((d) => (
        <g key={d.label}>
          <line className="tick" x1={d.x} y1="104" x2={d.x} y2="118" />
          <text x={d.x - 16} y="138">{d.label}</text>
        </g>
      ))}
      {marks.map((m) => (
        <g key={m.label}>
          <line className="mark" strokeWidth="1.5" x1={m.x} y1={m.y + 6} x2={m.x} y2="104" />
          <circle className="fill-orange" cx={m.x} cy="110" r="4.5" />
          <text className="hot" x={m.x - 34} y={m.y}>{m.label}</text>
        </g>
      ))}
      <text x="30" y="20">each step is ten times larger</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ force -- */

function ForceEffects() {
  const panels = [
    { x: 0, title: "starts motion" },
    { x: 120, title: "stops motion" },
    { x: 240, title: "changes direction" },
    { x: 360, title: "changes shape" },
  ];
  return (
    <svg viewBox="0 0 480 190" className="dgm" role="img"
      aria-label="Four panels showing the effects of a force: starting motion, stopping motion, changing direction and changing shape.">
      <ArrowDefs />
      {panels.map((p, i) => (
        <g key={p.title}>
          {i > 0 && <line className="tick" x1={p.x} y1="18" x2={p.x} y2="140" />}
          <text x={p.x + 8} y="164">{p.title}</text>
        </g>
      ))}
      {/* 1 starts moving */}
      <circle className="solid fill-paper" cx="46" cy="82" r="17" />
      <line className="mark" x1="68" y1="82" x2="108" y2="82" markerEnd="url(#ah-orange)" />
      {/* 2 stops */}
      <circle className="solid fill-paper" cx="196" cy="82" r="17" />
      <line className="mark" x1="176" y1="82" x2="146" y2="82" markerEnd="url(#ah-orange)" />
      <line className="beam" x1="212" y1="66" x2="212" y2="98" strokeWidth="4" />
      {/* 3 changes direction */}
      <circle className="solid fill-paper" cx="290" cy="102" r="15" />
      <path className="beam" d="M262 128 Q 300 112 316 62" />
      <line className="mark" x1="306" y1="96" x2="332" y2="72" markerEnd="url(#ah-orange)" />
      {/* 4 changes shape */}
      <rect className="solid fill-wash" x="386" y="62" width="58" height="42" />
      <path className="solid fill-wash" d="M386 116 h58 v28 q-29 -14 -58 0 z" opacity="0.9" />
      <line className="mark" x1="415" y1="30" x2="415" y2="56" markerEnd="url(#ah-orange)" />
    </svg>
  );
}

function PressureArea() {
  return (
    <svg viewBox="0 0 480 230" className="dgm" role="img"
      aria-label="The same 50 newton force acting on a wide base and on a narrow base, giving ten times the pressure on the narrow one.">
      <ArrowDefs />
      <line className="thick" x1="20" y1="176" x2="460" y2="176" />
      <rect x="20" y="176" width="440" height="10" fill="url(#hatch)" />

      {/* wide base */}
      <rect className="solid fill-wash" x="44" y="118" width="140" height="58" />
      <line className="mark" x1="114" y1="46" x2="114" y2="110" markerEnd="url(#ah-orange)" />
      <text className="hot" x="126" y="76">50 N</text>
      <text x="44" y="206">area 0.10 m2</text>
      <text className="cool" x="44" y="226">pressure 500 Pa</text>

      {/* narrow base */}
      <path className="solid fill-wash" d="M316 118 h72 l-24 58 h-24 z" />
      <line className="mark" x1="352" y1="46" x2="352" y2="110" markerEnd="url(#ah-orange)" />
      <text className="hot" x="364" y="76">50 N</text>
      <text x="300" y="206">area 0.01 m2</text>
      <text className="cool" x="300" y="226">pressure 5000 Pa</text>
    </svg>
  );
}

function LiquidPressure() {
  return (
    <svg viewBox="0 0 480 260" className="dgm" role="img"
      aria-label="A container of water with three holes at different depths. The jet from the lowest hole travels furthest, because pressure increases with depth.">
      <ArrowDefs />
      {/* container */}
      <path className="thick" d="M100 26 V214 H236 V26" />
      <rect className="fill-wash" x="102" y="52" width="132" height="161" />
      <line className="solid" x1="102" y1="52" x2="234" y2="52" />
      <text x="112" y="42">water</text>
      {/* ground */}
      <line className="thick" x1="60" y1="214" x2="460" y2="214" />
      {/* three jets, each starting at its hole */}
      <path className="beam" d="M236 90 Q 286 96 300 214" />
      <path className="beam" d="M236 134 Q 316 142 356 214" />
      <path className="beam" d="M236 178 Q 356 186 428 214" />
      <g className="fill-orange">
        <circle cx="236" cy="90" r="4" />
        <circle cx="236" cy="134" r="4" />
        <circle cx="236" cy="178" r="4" />
      </g>
      <text x="248" y="74">shallow</text>
      <text x="286" y="120">deeper</text>
      <text className="hot" x="330" y="166">deepest, furthest</text>
      {/* depth arrow */}
      <line className="axis" x1="80" y1="52" x2="80" y2="178" markerEnd="url(#ah-ink)" />
      <text x="14" y="122">depth</text>
    </svg>
  );
}

function DistanceTime() {
  // Three phases: uniform speed, at rest, then faster uniform speed.
  return (
    <svg viewBox="0 0 480 270" className="dgm" role="img"
      aria-label="A distance time graph with three phases: a straight sloping line, a horizontal line where the object is at rest, and a steeper line where it moves faster.">
      <ArrowDefs />
      {/* grid */}
      <g className="tick" opacity="0.22">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`v${i}`} x1={70 + i * 60} y1="30" x2={70 + i * 60} y2="210" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <line key={`h${i}`} x1="70" y1={210 - i * 60} x2="430" y2={210 - i * 60} />
        ))}
      </g>
      {/* axes */}
      <line className="thick" x1="70" y1="210" x2="440" y2="210" markerEnd="url(#ah-ink)" />
      <line className="thick" x1="70" y1="210" x2="70" y2="24" markerEnd="url(#ah-ink)" />
      <text x="330" y="242">time (s)</text>
      <text x="6" y="40">distance (m)</text>
      {/* the journey */}
      <path className="beam" strokeWidth="3" d="M70 210 L190 150" />
      <path className="beam" strokeWidth="3" d="M190 150 L250 150" />
      <path className="beam" strokeWidth="3" d="M250 150 L370 30" />
      <g className="fill-orange">
        <circle cx="190" cy="150" r="5" />
        <circle cx="250" cy="150" r="5" />
      </g>
      <text x="86" y="188">steady</text>
      <text className="hot" x="192" y="140">at rest</text>
      <text x="286" y="86">faster</text>
      {/* axis values */}
      <text x="60" y="228">0</text>
      <text x="184" y="228">2</text>
      <text x="244" y="228">3</text>
      <text x="364" y="228">5</text>
      <text x="40" y="156">20</text>
      <text x="40" y="36">40</text>
    </svg>
  );
}

/* ---------------------------------------------------------------- registry -- */

const FIGURES: Record<string, () => ReactNode> = {
  "reflection-law": ReflectionLaw,
  "plane-mirror": PlaneMirror,
  "refraction-slab": RefractionSlab,
  "convex-lens": ConvexLens,
  "human-eye": HumanEye,
  "animal-cell": AnimalCell,
  "plant-cell": PlantCell,
  "cell-scale": CellScale,
  "force-effects": ForceEffects,
  "pressure-area": PressureArea,
  "liquid-pressure": LiquidPressure,
  "distance-time": DistanceTime,
};

export function hasFigure(key: string): boolean {
  return key in FIGURES;
}

export default function Figure({ name, caption }: { name: string; caption?: string | null }) {
  const Drawing = FIGURES[name];
  if (!Drawing) return null;

  // Captions arrive as "Fig 4.1  Object at 2F..." so the label can be emphasised.
  const match = caption?.match(/^(Fig\s[\d.]+)\s+(.*)$/s);

  return (
    <figure className="figure" data-figure={name}>
      <Drawing />
      {caption && (
        <figcaption>
          {match ? (
            <>
              <b>{match[1]}</b> {match[2]}
            </>
          ) : (
            caption
          )}
        </figcaption>
      )}
    </figure>
  );
}
