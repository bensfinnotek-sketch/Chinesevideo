/**
 * Curated High-Aesthetic Educational Art Presets
 * Tạo ảnh minh họa SVG vector chất lượng cao (16:9 & 9:16) mang phong cách:
 * - warm educational animation
 * - clean Chinese modern classroom
 * - soft lighting, friendly characters
 * - KHÔNG chứa chữ (no text)
 */

export function generateEducationalSvgDataUrl(
  sceneType: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  customContext?: string
): string {
  const width = aspectRatio === '16:9' ? 1280 : 720;
  const height = aspectRatio === '16:9' ? 720 : 1280;

  // Kiểm tra ngữ cảnh thi cử
  const isExamContext = customContext && /考试|期中|复习|紧张|exam|test/i.test(customContext);

  let svgContent = '';

  if (isExamContext) {
    svgContent = getExamRoomSvg(width, height);
  } else {
    switch (sceneType) {
      case 'intro':
        svgContent = getClassroomSvg(width, height);
        break;
      case 'dialogue':
        svgContent = getCafeDialogueSvg(width, height);
        break;
      case 'sentence_breakdown':
      case 'word_highlight':
        svgContent = getStudyDeskSvg(width, height);
        break;
      case 'listening_drill':
        svgContent = getListeningLibrarySvg(width, height);
        break;
      case 'review_summary':
      case 'new_examples':
      default:
        svgContent = getCampusSunsetSvg(width, height);
        break;
    }
  }

  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// 1. Cảnh phòng thi / Ôn thi (Exam / Study classroom)
function getExamRoomSvg(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FBF7EE"/>
        <stop offset="100%" stop-color="#EFE6D5"/>
      </linearGradient>
      <linearGradient id="sunbeam" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFF5D6" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#FFF" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="desk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#C29668"/>
        <stop offset="100%" stop-color="#9C7248"/>
      </linearGradient>
      <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#C9E6FF"/>
        <stop offset="100%" stop-color="#E2F1FF"/>
      </linearGradient>
    </defs>

    <!-- Wall & Floor -->
    <rect width="${w}" height="${h * 0.75}" fill="url(#wall)"/>
    <rect y="${h * 0.75}" width="${w}" height="${h * 0.25}" fill="#D8C9B4"/>

    <!-- Large classroom window -->
    <rect x="${w * 0.08}" y="${h * 0.12}" width="${w * 0.35}" height="${h * 0.5}" rx="8" fill="url(#window)" stroke="#BAA590" stroke-width="4"/>
    <line x1="${w * 0.25}" y1="${h * 0.12}" x2="${w * 0.25}" y2="${h * 0.62}" stroke="#BAA590" stroke-width="4"/>
    <line x1="${w * 0.08}" y1="${h * 0.37}" x2="${w * 0.43}" y2="${h * 0.37}" stroke="#BAA590" stroke-width="4"/>

    <!-- Green tree outside window -->
    <circle cx="${w * 0.18}" cy="${h * 0.4}" r="${w * 0.09}" fill="#78B878" opacity="0.8"/>
    <circle cx="${w * 0.32}" cy="${h * 0.35}" r="${w * 0.11}" fill="#5A9E5A" opacity="0.7"/>

    <!-- Sunlight Beam -->
    <polygon points="${w * 0.08},${h * 0.12} ${w * 0.8},${h} ${w * 0.3},${h} ${w * 0.08},${h * 0.5}" fill="url(#sunbeam)"/>

    <!-- Student at Desk Silhouette (Warm Anime Style) -->
    <!-- Chair back -->
    <rect x="${w * 0.52}" y="${h * 0.42}" width="${w * 0.14}" height="${h * 0.28}" rx="6" fill="#88705C"/>
    <!-- Student Head & Hair -->
    <circle cx="${w * 0.59}" cy="${h * 0.38}" r="${h * 0.07}" fill="#3C3432"/>
    <path d="M ${w * 0.54} ${h * 0.39} Q ${w * 0.59} ${h * 0.43} ${w * 0.64} ${h * 0.39} Z" fill="#E6BA9A"/>
    <!-- Shoulders & Torso (studying posture) -->
    <path d="M ${w * 0.50} ${h * 0.58} C ${w * 0.53} ${h * 0.45} ${w * 0.65} ${h * 0.45} ${w * 0.68} ${h * 0.58} Z" fill="#50718A"/>

    <!-- Wooden Desk -->
    <polygon points="${w * 0.42},${h * 0.56} ${w * 0.86},${h * 0.56} ${w * 0.88},${h * 0.78} ${w * 0.38},${h * 0.78}" fill="url(#desk)"/>
    <rect x="${w * 0.44}" y="${h * 0.78}" width="${w * 0.03}" height="${h * 0.2}" fill="#6E4F32"/>
    <rect x="${w * 0.81}" y="${h * 0.78}" width="${w * 0.03}" height="${h * 0.2}" fill="#6E4F32"/>

    <!-- Exam Paper on Desk -->
    <rect x="${w * 0.54}" y="${h * 0.60}" width="${w * 0.18}" height="${h * 0.12}" rx="3" fill="#FFFFFF" transform="rotate(-6 ${w * 0.63} ${h * 0.66})" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))"/>
    <!-- Fountain Pen -->
    <line x1="${w * 0.71}" y1="${h * 0.63}" x2="${w * 0.76}" y2="${h * 0.68}" stroke="#2B3A42" stroke-width="4" stroke-linecap="round"/>

    <!-- Potted Plant on Window Sill -->
    <rect x="${w * 0.12}" y="${h * 0.58}" width="${w * 0.05}" height="${h * 0.05}" fill="#B86C45" rx="2"/>
    <circle cx="${w * 0.145}" cy="${h * 0.56}" r="${h * 0.03}" fill="#4E8C5A"/>
  </svg>`;
}

// 2. Lớp học hiện đại tươi sáng (Intro)
function getClassroomSvg(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bgIntro" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFFDF7"/>
        <stop offset="100%" stop-color="#F2E9DA"/>
      </linearGradient>
      <linearGradient id="blackboard" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#345B4A"/>
        <stop offset="100%" stop-color="#244234"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bgIntro)"/>
    <!-- Blackboard -->
    <rect x="${w * 0.15}" y="${h * 0.1}" width="${w * 0.7}" height="${h * 0.45}" rx="10" fill="url(#blackboard)" stroke="#7D5C3A" stroke-width="8"/>
    <!-- Podium -->
    <polygon points="${w * 0.38},${h * 0.65} ${w * 0.62},${h * 0.65} ${w * 0.65},${h} ${w * 0.35},${h}" fill="#9C7248"/>
    <!-- Wooden Desks -->
    <rect x="${w * 0.08}" y="${h * 0.72}" width="${w * 0.25}" height="${h * 0.2}" rx="4" fill="#C29668"/>
    <rect x="${w * 0.67}" y="${h * 0.72}" width="${w * 0.25}" height="${h * 0.2}" rx="4" fill="#C29668"/>
    <!-- Soft Sunlight Atmosphere -->
    <circle cx="${w * 0.85}" cy="${h * 0.2}" r="${w * 0.25}" fill="#FFE6A8" opacity="0.3"/>
  </svg>`;
}

// 3. Quán Cafe đối thoại (Dialogue Scene)
function getCafeDialogueSvg(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="cafeBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FAF4EA"/>
        <stop offset="100%" stop-color="#E8DAC5"/>
      </linearGradient>
      <linearGradient id="cafeTable" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#A67C52"/>
        <stop offset="100%" stop-color="#805936"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#cafeBg)"/>
    <!-- Cafe Glass Window -->
    <rect x="${w * 0.05}" y="${h * 0.08}" width="${w * 0.9}" height="${h * 0.48}" rx="8" fill="#D6ECFF" opacity="0.8"/>
    <!-- Campus Greenery bokeh -->
    <circle cx="${w * 0.2}" cy="${h * 0.25}" r="${h * 0.18}" fill="#89C489" opacity="0.6"/>
    <circle cx="${w * 0.5}" cy="${h * 0.2}" r="${h * 0.14}" fill="#6DAA6D" opacity="0.6"/>
    <circle cx="${w * 0.8}" cy="${h * 0.28}" r="${h * 0.2}" fill="#9DD69D" opacity="0.6"/>
    <!-- Cafe Table -->
    <ellipse cx="${w * 0.5}" cy="${h * 0.72}" rx="${w * 0.35}" ry="${h * 0.16}" fill="url(#cafeTable)"/>
    <!-- Coffee cups -->
    <circle cx="${w * 0.4}" cy="${h * 0.7}" r="${h * 0.035}" fill="#FFF" stroke="#B89678" stroke-width="3"/>
    <circle cx="${w * 0.6}" cy="${h * 0.7}" r="${h * 0.035}" fill="#FFF" stroke="#B89678" stroke-width="3"/>
    <!-- Notebooks -->
    <rect x="${w * 0.44}" y="${h * 0.66}" width="${w * 0.12}" height="${h * 0.09}" rx="4" fill="#D9534F" transform="rotate(8 ${w * 0.5} ${h * 0.7})"/>
  </svg>`;
}

// 4. Góc bàn học & Đèn bàn tĩnh lặng (Breakdown / Highlight)
function getStudyDeskSvg(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="deskBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2D3748"/>
        <stop offset="100%" stop-color="#1A202C"/>
      </linearGradient>
      <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFEBB0" stop-opacity="0.9"/>
        <stop offset="60%" stop-color="#FFE18A" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#FFE18A" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#deskBg)"/>
    <!-- Desk surface -->
    <rect y="${h * 0.6}" width="${w}" height="${h * 0.4}" fill="#684D34"/>
    <!-- Lamp glow -->
    <circle cx="${w * 0.3}" cy="${h * 0.45}" r="${h * 0.4}" fill="url(#lampGlow)"/>
    <!-- Desk lamp -->
    <path d="M ${w * 0.22} ${h * 0.65} L ${w * 0.28} ${h * 0.35} L ${w * 0.34} ${h * 0.38}" stroke="#E2E8F0" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M ${w * 0.32} ${h * 0.34} L ${w * 0.40} ${h * 0.42} L ${w * 0.32} ${h * 0.46} Z" fill="#ECC94B"/>
    <!-- Open Book -->
    <path d="M ${w * 0.45} ${h * 0.7} Q ${w * 0.55} ${h * 0.67} ${w * 0.65} ${h * 0.7} L ${w * 0.67} ${h * 0.85} Q ${w * 0.55} ${h * 0.82} ${w * 0.43} ${h * 0.85} Z" fill="#F7FAFC"/>
    <path d="M ${w * 0.55} ${h * 0.67} L ${w * 0.55} ${h * 0.82}" stroke="#CBD5E0" stroke-width="2"/>
  </svg>`;
}

// 5. Thư viện luyện nghe (Listening Drill)
function getListeningLibrarySvg(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="libBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#EAE0D0"/>
        <stop offset="100%" stop-color="#D4C2AA"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#libBg)"/>
    <!-- Bookshelves in background -->
    <rect x="${w * 0.05}" y="${h * 0.1}" width="${w * 0.22}" height="${h * 0.7}" rx="6" fill="#805936"/>
    <rect x="${w * 0.32}" y="${h * 0.1}" width="${w * 0.22}" height="${h * 0.7}" rx="6" fill="#6B482A"/>
    <rect x="${w * 0.59}" y="${h * 0.1}" width="${w * 0.22}" height="${h * 0.7}" rx="6" fill="#805936"/>
    <!-- Colorful book stripes -->
    <g fill="#B85C42" opacity="0.8">
      <rect x="${w * 0.07}" y="${h * 0.15}" width="${w * 0.03}" height="${h * 0.18}"/>
      <rect x="${w * 0.11}" y="${h * 0.13}" width="${w * 0.04}" height="${h * 0.2}"/>
      <rect x="${w * 0.34}" y="${h * 0.14}" width="${w * 0.04}" height="${h * 0.19}" fill="#40698A"/>
      <rect x="${w * 0.61}" y="${h * 0.16}" width="${w * 0.04}" height="${h * 0.17}" fill="#4A7C59"/>
    </g>
    <!-- Big Window with Light -->
    <circle cx="${w * 0.5}" cy="${h * 0.5}" r="${h * 0.35}" fill="#FFF6DC" opacity="0.35"/>
  </svg>`;
}

// 6. Hoàng hôn khuôn viên trường đại học (Review Summary)
function getCampusSunsetSvg(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="sunsetSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#E27357"/>
        <stop offset="50%" stop-color="#F2A56D"/>
        <stop offset="100%" stop-color="#F9DF98"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sunsetSky)"/>
    <!-- Sun -->
    <circle cx="${w * 0.5}" cy="${h * 0.58}" r="${h * 0.22}" fill="#FFF4D0" opacity="0.9"/>
    <!-- Distant campus skyline / pagodas silhouette -->
    <path d="M 0 ${h * 0.68} Q ${w * 0.25} ${h * 0.62} ${w * 0.5} ${h * 0.65} T ${w} ${h * 0.68} L ${w} ${h} L 0 ${h} Z" fill="#6B3A42" opacity="0.6"/>
    <!-- Green hills & trees -->
    <path d="M 0 ${h * 0.76} Q ${w * 0.35} ${h * 0.72} ${w * 0.7} ${h * 0.75} T ${w} ${h * 0.8} L ${w} ${h} L 0 ${h} Z" fill="#3E5442"/>
    <!-- Streetlamp / path -->
    <rect x="${w * 0.49}" y="${h * 0.75}" width="${w * 0.02}" height="${h * 0.25}" fill="#D8BE96"/>
  </svg>`;
}
