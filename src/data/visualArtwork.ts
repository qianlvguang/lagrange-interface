import type { BBoxNorm } from '../types/lagrange';

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

/**
 * Generates crisp, self-contained vector reference artworks (zero external URL dependency).
 * Uses UTF-8 encodeURIComponent instead of btoa to safely embed CJK labels.
 */
export function buildAssetArtwork(
  variant:
    | 'crest-lion'
    | 'crest-laurel'
    | 'crest-shield'
    | 'crest-star'
    | 'ip-flame'
    | 'ip-frost'
    | 'ip-cyber'
    | 'ip-dragon'
    | 'brand-atelier'
    | 'brand-horizon'
    | 'brand-nordic'
    | 'brand-kintsugi'
    | 'substrate-hoodie'
    | 'substrate-tote'
    | 'substrate-cap'
    | 'substrate-jersey',
  primary: string,
  secondary: string,
  accent: string,
  label: string
): string {
  const bg = `<defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDFBF7"/>
      <stop offset="100%" stop-color="#F1ECE2"/>
    </linearGradient>
    <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="320" rx="28" fill="url(#bgGrad)"/>
  <circle cx="160" cy="145" r="115" fill="url(#glow)"/>`;

  let emblem = '';
  switch (variant) {
    case 'crest-lion':
      emblem = `
        <path d="M160 54 L232 82 V146 C232 198 198 234 160 250 C122 234 88 198 88 146 V82 Z" fill="url(#mainGrad)" stroke="#1C1B18" stroke-opacity="0.14" stroke-width="2"/>
        <path d="M160 68 L218 91 V144 C218 188 190 218 160 233 C130 218 102 188 102 144 V91 Z" fill="none" stroke="${accent}" stroke-width="3"/>
        <polygon points="160,96 172,126 204,128 178,148 188,180 160,162 132,180 142,148 116,128 148,126" fill="${accent}"/>
        <circle cx="160" cy="142" r="14" fill="#FFFDF8" fill-opacity="0.9"/>`;
      break;
    case 'crest-laurel':
      emblem = `
        <circle cx="160" cy="148" r="82" fill="url(#mainGrad)"/>
        <circle cx="160" cy="148" r="66" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 6"/>
        <path d="M114 176 C100 145 108 114 134 98 M206 176 C220 145 212 114 186 98" fill="none" stroke="#FFFDF8" stroke-width="6" stroke-linecap="round"/>
        <polygon points="160,108 188,158 160,188 132,158" fill="${accent}"/>
        <circle cx="160" cy="148" r="12" fill="#FFFDF8"/>`;
      break;
    case 'crest-shield':
      emblem = `
        <rect x="86" y="70" width="148" height="156" rx="34" fill="url(#mainGrad)"/>
        <path d="M86 148 H234 M160 70 V226" stroke="#FFFDF8" stroke-opacity="0.32" stroke-width="8"/>
        <circle cx="160" cy="148" r="42" fill="#FFFDF8" fill-opacity="0.92"/>
        <path d="M142 148 L156 164 L182 132" fill="none" stroke="${primary}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    case 'crest-star':
      emblem = `
        <polygon points="160,56 188,116 254,124 206,168 218,234 160,202 102,234 114,168 66,124 132,116" fill="url(#mainGrad)" stroke="${accent}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="160" cy="152" r="28" fill="#FFFDF8"/>
        <circle cx="160" cy="152" r="14" fill="${accent}"/>`;
      break;
    case 'ip-flame':
      emblem = `
        <circle cx="160" cy="148" r="82" fill="#1C1B18" fill-opacity="0.06"/>
        <path d="M164 60 C196 98 224 128 216 172 C210 206 186 228 160 228 C126 228 102 200 106 164 C109 136 128 118 134 94 C144 106 148 116 150 124 C156 104 160 82 164 60 Z" fill="url(#mainGrad)"/>
        <path d="M162 126 C178 146 186 164 180 186 C175 202 166 210 158 210 C142 210 134 196 136 178 C138 162 150 148 162 126 Z" fill="${accent}"/>
        <circle cx="144" cy="170" r="5" fill="#1C1B18"/>
        <circle cx="176" cy="170" r="5" fill="#1C1B18"/>`;
      break;
    case 'ip-frost':
      emblem = `
        <polygon points="160,58 232,102 232,190 160,234 88,190 88,102" fill="url(#mainGrad)" fill-opacity="0.92"/>
        <polygon points="160,78 214,112 214,180 160,214 106,180 106,112" fill="none" stroke="#FFFDF8" stroke-width="3"/>
        <path d="M160 86 V206 M108 116 L212 176 M212 116 L108 176" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="160" cy="146" r="18" fill="#FFFDF8"/>`;
      break;
    case 'ip-cyber':
      emblem = `
        <rect x="82" y="76" width="156" height="142" rx="38" fill="url(#mainGrad)"/>
        <rect x="102" y="102" width="116" height="62" rx="18" fill="#1C1B18"/>
        <circle cx="136" cy="133" r="11" fill="${accent}"/>
        <circle cx="184" cy="133" r="11" fill="${accent}"/>
        <path d="M134 188 H186" stroke="#FFFDF8" stroke-width="6" stroke-linecap="round"/>
        <path d="M114 76 L102 54 M206 76 L218 54" stroke="${primary}" stroke-width="7" stroke-linecap="round"/>`;
      break;
    case 'ip-dragon':
      emblem = `
        <circle cx="160" cy="148" r="82" fill="url(#mainGrad)"/>
        <path d="M116 174 C122 122 152 94 196 106 C182 118 180 132 194 146 C172 154 166 172 184 194 C150 202 128 192 116 174 Z" fill="${accent}"/>
        <circle cx="162" cy="126" r="7" fill="#1C1B18"/>
        <circle cx="160" cy="148" r="72" fill="none" stroke="#FFFDF8" stroke-opacity="0.45" stroke-width="2.5"/>`;
      break;
    case 'brand-atelier':
      emblem = `
        <circle cx="160" cy="146" r="74" fill="none" stroke="url(#mainGrad)" stroke-width="14"/>
        <path d="M126 184 L160 98 L194 184 M138 158 H182" fill="none" stroke="${primary}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="160" cy="72" r="9" fill="${accent}"/>`;
      break;
    case 'brand-horizon':
      emblem = `
        <rect x="78" y="82" width="164" height="128" rx="22" fill="url(#mainGrad)"/>
        <circle cx="160" cy="134" r="32" fill="${accent}"/>
        <path d="M78 164 Q120 144 160 164 T242 164 V188 Q242 210 220 210 H100 Q78 210 78 188 Z" fill="#FFFDF8" fill-opacity="0.9"/>`;
      break;
    case 'brand-nordic':
      emblem = `
        <path d="M96 196 L142 96 L176 154 L198 118 L228 196 Z" fill="url(#mainGrad)" stroke="#FFFDF8" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="204" cy="92" r="18" fill="${accent}"/>`;
      break;
    case 'brand-kintsugi':
      emblem = `
        <circle cx="160" cy="146" r="78" fill="url(#mainGrad)"/>
        <path d="M98 124 L144 142 L162 104 L188 156 L224 142" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M144 142 L134 196 M188 156 L196 202" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
      break;
    case 'substrate-hoodie':
      emblem = `
        <path d="M112 86 C126 70 194 70 208 86 L246 122 L226 152 L206 136 V226 H114 V136 L94 152 L74 122 Z" fill="url(#mainGrad)" stroke="#1C1B18" stroke-opacity="0.16" stroke-width="3" stroke-linejoin="round"/>
        <path d="M136 82 C142 104 178 104 184 82" fill="none" stroke="#FFFDF8" stroke-opacity="0.7" stroke-width="4"/>
        <rect x="134" y="166" width="52" height="32" rx="8" fill="#000" fill-opacity="0.08"/>`;
      break;
    case 'substrate-tote':
      emblem = `
        <path d="M132 106 V78 C132 64 188 64 188 78 V106" fill="none" stroke="${primary}" stroke-width="9" stroke-linecap="round"/>
        <path d="M98 104 H222 L232 226 H88 Z" fill="url(#mainGrad)" stroke="#1C1B18" stroke-opacity="0.16" stroke-width="3" stroke-linejoin="round"/>
        <line x1="106" y1="122" x2="214" y2="122" stroke="#FFFDF8" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="5 4"/>`;
      break;
    case 'substrate-cap':
      emblem = `
        <path d="M96 164 C96 108 134 86 162 86 C198 86 226 112 226 164 Z" fill="url(#mainGrad)"/>
        <path d="M84 164 Q162 184 244 166 Q204 196 124 192 Z" fill="${secondary}"/>
        <circle cx="162" cy="84" r="7" fill="${accent}"/>`;
      break;
    case 'substrate-jersey':
      emblem = `
        <path d="M116 74 L142 86 C152 94 168 94 178 86 L204 74 L244 108 L222 140 L204 126 V226 H116 V126 L98 140 L76 108 Z" fill="url(#mainGrad)" stroke="#1C1B18" stroke-opacity="0.14" stroke-width="3" stroke-linejoin="round"/>
        <line x1="136" y1="92" x2="136" y2="226" stroke="${accent}" stroke-width="6" stroke-opacity="0.7"/>
        <line x1="184" y1="92" x2="184" y2="226" stroke="${accent}" stroke-width="6" stroke-opacity="0.7"/>`;
      break;
  }

  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      ${bg}
      ${emblem}
      <rect x="28" y="258" width="264" height="36" rx="18" fill="#FFFFFF" fill-opacity="0.76" stroke="#1C1B18" stroke-opacity="0.08"/>
      <text x="160" y="281" text-anchor="middle" font-family="Inter, PingFang SC, sans-serif" font-size="13" font-weight="600" fill="#1C1B18">${label}</text>
    </svg>
  `);
}

/**
 * Generates synthetic product composite artwork where the embedded motif sits
 * strictly inside the normalized [ymin, xmin, ymax, xmax] (0-1000) bbox
 * on a 600x600 canvas so BBox overlay aligns down to the pixel.
 */
export function buildGeneratedCompositeArtwork(opts: {
  garment: 'hoodie' | 'tote' | 'cap' | 'jersey';
  garmentColor: string;
  garmentShade: string;
  motifColor: string;
  motifAccent: string;
  motifType: 'crest' | 'star' | 'flame' | 'hex' | 'arch' | 'diamond';
  bbox: BBoxNorm;
  label: string;
  shiftX?: number;
  shiftY?: number;
}): string {
  const [ymin, xmin, ymax, xmax] = opts.bbox;
  const bx = xmin * 0.6 + (opts.shiftX ?? 0);
  const by = ymin * 0.6 + (opts.shiftY ?? 0);
  const bw = (xmax - xmin) * 0.6;
  const bh = (ymax - ymin) * 0.6;
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const r = Math.min(bw, bh) * 0.44;

  let garmentShape = '';
  if (opts.garment === 'hoodie') {
    garmentShape = `
      <path d="M175 110 C220 74 380 74 425 110 L520 198 L470 278 L420 236 V515 H180 V236 L130 278 L80 198 Z" fill="${opts.garmentColor}" stroke="${opts.garmentShade}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M235 102 C252 152 348 152 365 102" fill="none" stroke="${opts.garmentShade}" stroke-width="5"/>
      <path d="M210 385 H390 L404 472 H196 Z" fill="${opts.garmentShade}" fill-opacity="0.35"/>
      <path d="M220 200 Q300 218 380 200" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="3"/>`;
  } else if (opts.garment === 'tote') {
    garmentShape = `
      <path d="M228 175 V105 C228 70 372 70 372 105 V175" fill="none" stroke="${opts.garmentShade}" stroke-width="18" stroke-linecap="round"/>
      <path d="M148 168 H452 L476 516 H124 Z" fill="${opts.garmentColor}" stroke="${opts.garmentShade}" stroke-width="4" stroke-linejoin="round"/>
      <line x1="162" y1="204" x2="438" y2="204" stroke="${opts.garmentShade}" stroke-opacity="0.5" stroke-width="3" stroke-dasharray="9 6"/>`;
  } else if (opts.garment === 'cap') {
    garmentShape = `
      <path d="M145 335 C145 190 230 135 305 135 C395 135 462 200 462 335 Z" fill="${opts.garmentColor}" stroke="${opts.garmentShade}" stroke-width="4"/>
      <path d="M122 335 Q305 385 496 340 Q395 415 198 408 Z" fill="${opts.garmentShade}"/>
      <circle cx="305" cy="130" r="12" fill="${opts.garmentShade}"/>`;
  } else {
    garmentShape = `
      <path d="M185 95 L252 128 C278 148 322 148 348 128 L415 95 L515 182 L462 262 L416 226 V518 H184 V226 L138 262 L85 182 Z" fill="${opts.garmentColor}" stroke="${opts.garmentShade}" stroke-width="4" stroke-linejoin="round"/>
      <line x1="230" y1="140" x2="230" y2="518" stroke="${opts.garmentShade}" stroke-opacity="0.4" stroke-width="10"/>
      <line x1="370" y1="140" x2="370" y2="518" stroke="${opts.garmentShade}" stroke-opacity="0.4" stroke-width="10"/>`;
  }

  let motif = '';
  if (opts.motifType === 'crest') {
    motif = `
      <path d="M${cx} ${cy - r} L${cx + r * 0.88} ${cy - r * 0.56} V${cy + r * 0.14} C${cx + r * 0.88} ${cy + r * 0.68} ${cx + r * 0.45} ${cy + r * 0.94} ${cx} ${cy + r * 1.05} C${cx - r * 0.45} ${cy + r * 0.94} ${cx - r * 0.88} ${cy + r * 0.68} ${cx - r * 0.88} ${cy + r * 0.14} V${cy - r * 0.56} Z" fill="${opts.motifColor}" stroke="${opts.motifAccent}" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy - r * 0.05}" r="${r * 0.34}" fill="${opts.motifAccent}"/>`;
  } else if (opts.motifType === 'star') {
    motif = `
      <circle cx="${cx}" cy="${cy}" r="${r * 0.96}" fill="${opts.motifColor}" stroke="${opts.motifAccent}" stroke-width="4"/>
      <polygon points="${cx},${cy - r * 0.66} ${cx + r * 0.22},${cy - r * 0.18} ${cx + r * 0.72},${cy - r * 0.12} ${cx + r * 0.34},${cy + r * 0.24} ${cx + r * 0.45},${cy + r * 0.72} ${cx},${cy + r * 0.46} ${cx - r * 0.45},${cy + r * 0.72} ${cx - r * 0.34},${cy + r * 0.24} ${cx - r * 0.72},${cy - r * 0.12} ${cx - r * 0.22},${cy - r * 0.18}" fill="${opts.motifAccent}"/>`;
  } else if (opts.motifType === 'flame') {
    motif = `
      <rect x="${bx + 6}" y="${by + 6}" width="${bw - 12}" height="${bh - 12}" rx="18" fill="${opts.motifColor}" fill-opacity="0.92"/>
      <path d="M${cx} ${cy - r * 0.75} C${cx + r * 0.48} ${cy - r * 0.25} ${cx + r * 0.65} ${cy + r * 0.18} ${cx + r * 0.42} ${cy + r * 0.62} C${cx + r * 0.2} ${cy + r * 0.85} ${cx - r * 0.2} ${cy + r * 0.85} ${cx - r * 0.44} ${cy + r * 0.6} C${cx - r * 0.65} ${cy + r * 0.22} ${cx - r * 0.32} ${cy - r * 0.2} ${cx} ${cy - r * 0.75} Z" fill="${opts.motifAccent}"/>`;
  } else if (opts.motifType === 'hex') {
    motif = `
      <polygon points="${cx},${cy - r} ${cx + r * 0.86},${cy - r * 0.5} ${cx + r * 0.86},${cy + r * 0.5} ${cx},${cy + r} ${cx - r * 0.86},${cy + r * 0.5} ${cx - r * 0.86},${cy - r * 0.5}" fill="${opts.motifColor}" stroke="${opts.motifAccent}" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.36}" fill="${opts.motifAccent}"/>`;
  } else if (opts.motifType === 'arch') {
    motif = `
      <circle cx="${cx}" cy="${cy}" r="${r * 0.92}" fill="none" stroke="${opts.motifColor}" stroke-width="11"/>
      <path d="M${cx - r * 0.42} ${cy + r * 0.46} L${cx} ${cy - r * 0.52} L${cx + r * 0.42} ${cy + r * 0.46}" fill="none" stroke="${opts.motifAccent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else {
    motif = `
      <rect x="${bx + 8}" y="${by + 8}" width="${bw - 16}" height="${bh - 16}" rx="12" fill="${opts.motifColor}"/>
      <polygon points="${cx},${cy - r * 0.72} ${cx + r * 0.72},${cy} ${cx},${cy + r * 0.72} ${cx - r * 0.72},${cy}" fill="${opts.motifAccent}"/>`;
  }

  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <radialGradient id="studioBg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#FAF7F0"/>
          <stop offset="100%" stop-color="#E7E0D3"/>
        </radialGradient>
        <filter id="drop" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#2D241A" flood-opacity="0.14"/>
        </filter>
      </defs>
      <rect width="600" height="600" fill="url(#studioBg)"/>
      <ellipse cx="300" cy="540" rx="190" ry="22" fill="#2D241A" fill-opacity="0.1"/>
      <g filter="url(#drop)">
        ${garmentShape}
      </g>
      <g>
        ${motif}
      </g>
      <rect x="24" y="22" width="184" height="30" rx="15" fill="#FFFDF8" fill-opacity="0.82"/>
      <text x="116" y="42" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#5F5C55">${opts.label}</text>
    </svg>
  `);
}
