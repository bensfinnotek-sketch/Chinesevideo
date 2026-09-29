import { LessonScene } from '../../types/lesson';
import { AudioMetadata, AudioSegment } from '../audioEngine/types';
import { SceneVisualMetadata } from '../../types/visual';
import { VideoComposerConfig, TransitionType } from '../../types/composer';
import { parseDialogueTurns, DialogueTurn } from '../dialogueParser';

export interface RenderFrameOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  scene: LessonScene;
  visualMeta?: SceneVisualMetadata;
  audioMeta?: AudioMetadata;
  currentTimeInScene: number;
  config: VideoComposerConfig;
  transitionProgress?: number; // 0 (start) -> 1 (end)
  transitionType?: TransitionType;
  imageElement?: HTMLImageElement | null;
}

/**
 * Vẽ hoàn chỉnh 1 Frame của Scene tại thời điểm currentTimeInScene
 * tuân thủ cấu trúc 10 layer và Title Safe Area
 */
export function renderSceneCanvasFrame({
  ctx,
  width,
  height,
  scene,
  visualMeta,
  audioMeta,
  currentTimeInScene,
  config,
  transitionProgress = 0,
  transitionType = 'crossfade',
  imageElement = null,
}: RenderFrameOptions) {
  // ==========================================
  // LAYER 1: BACKGROUND VISUAL
  // ==========================================
  const isDark = config.themeStyle === 'studio_dark';

  if (visualMeta && visualMeta.visualMode !== 'no_visual' && imageElement && imageElement.complete) {
    // Vẽ ảnh hoặc khung hình video dạng object-cover
    drawCoverImage(ctx, imageElement, width, height);

    // Lớp phủ gradient bán trong suốt để đảm bảo chữ Hán & phụ đề luôn tương phản tối đa
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (isDark) {
      grad.addColorStop(0, 'rgba(11, 15, 25, 0.65)');
      grad.addColorStop(0.5, 'rgba(11, 15, 25, 0.75)');
      grad.addColorStop(1, 'rgba(11, 15, 25, 0.92)');
    } else {
      grad.addColorStop(0, 'rgba(253, 252, 247, 0.75)');
      grad.addColorStop(0.5, 'rgba(253, 252, 247, 0.85)');
      grad.addColorStop(1, 'rgba(253, 252, 247, 0.96)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Nền tối giản màu giấy ấm áp YouTube hoặc Dark Studio
    ctx.fillStyle = isDark ? '#0B0F19' : config.themeStyle === 'clean_white' ? '#FFFFFF' : '#FDFCF7';
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient glow
    const radial = ctx.createRadialGradient(width / 2, height * 0.4, 50, width / 2, height * 0.4, width * 0.7);
    if (isDark) {
      radial.addColorStop(0, 'rgba(30, 41, 59, 0.5)');
      radial.addColorStop(1, 'rgba(11, 15, 25, 0)');
    } else {
      radial.addColorStop(0, 'rgba(255, 243, 214, 0.45)');
      radial.addColorStop(1, 'rgba(253, 252, 247, 0)');
    }
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  // ==========================================
  // LAYER 2: SAFE AREA MARGINS
  // Title-safe zone (10% padding) để không bị che bởi UI YouTube/TikTok
  // ==========================================
  const safeMarginX = width * 0.08;
  const safeMarginY = height * 0.08;
  const safeW = width - safeMarginX * 2;
  const safeH = height - safeMarginY * 2;

  if (config.showSafeAreaGuide) {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(safeMarginX, safeMarginY, safeW, safeH);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.7)';
    ctx.font = `600 ${Math.max(12, Math.floor(width * 0.012))}px sans-serif`;
    ctx.fillText('TITLE SAFE AREA (10%)', safeMarginX + 12, safeMarginY + 24);
    ctx.restore();
  }

  // ==========================================
  // LAYER 3: TOP HEADER & BRANDING
  // ==========================================
  const headerY = safeMarginY + height * 0.03;
  ctx.save();
  // Logo badge
  const badgeSize = Math.max(24, Math.floor(height * 0.04));
  ctx.fillStyle = '#E11D48';
  drawRoundedRect(ctx, safeMarginX, headerY - badgeSize * 0.8, badgeSize, badgeSize, 6);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.floor(badgeSize * 0.65)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('华', safeMarginX + badgeSize / 2, headerY - badgeSize * 0.8 + badgeSize / 2);

  // App title & Scene title
  ctx.textAlign = 'left';
  ctx.fillStyle = isDark ? '#FFFFFF' : '#1E293B';
  const brandFontSize = Math.max(14, Math.floor(height * 0.026));
  ctx.font = `bold ${brandFontSize}px sans-serif`;
  ctx.fillText('Chinese Video Lesson', safeMarginX + badgeSize + 12, headerY - badgeSize * 0.2);

  // Scene indicator pill
  const scenePillText = `SCENE ${scene.sceneId}: ${scene.type.toUpperCase()}`;
  ctx.font = `bold ${Math.max(12, Math.floor(height * 0.02))}px monospace`;
  const pillW = ctx.measureText(scenePillText).width + 20;
  const pillH = Math.max(22, Math.floor(height * 0.034));
  const pillX = safeMarginX + safeW - pillW;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(225, 29, 72, 0.1)';
  drawRoundedRect(ctx, pillX, headerY - pillH * 0.8, pillW, pillH, 6);
  ctx.fill();
  ctx.fillStyle = isDark ? '#FDA4AF' : '#E11D48';
  ctx.fillText(scenePillText, pillX + 10, headerY - pillH * 0.2);
  ctx.restore();

  // ==========================================
  // LAYER 4, 5, 6 & 7: TEXT OVERLAYS (CHINESE, PINYIN, VIETNAMESE & KARAOKE HIGHLIGHT)
  // ==========================================
  const turns: DialogueTurn[] = parseDialogueTurns(
    scene.chineseText,
    scene.pinyin,
    scene.vietnamese,
    scene.highlightWords
  );

  // Xác định segment audio đang hoạt động tại currentTimeInScene
  const activeSegment: AudioSegment | null = audioMeta?.segments.find(
    s => currentTimeInScene >= s.start && currentTimeInScene <= s.end
  ) || null;

  // Tính toán vùng trung tâm hiển thị
  const contentYStart = headerY + height * 0.08;
  const contentHeight = safeH * 0.65;

  if (turns.length > 0) {
    const turnSpacing = contentHeight / Math.max(1, turns.length);

    turns.forEach((turn, tIdx) => {
      const turnY = contentYStart + tIdx * turnSpacing;
      
      // 5. Speaker Name
      if (turn.characterName) {
        ctx.save();
        ctx.fillStyle = '#E11D48';
        const speakerFontSize = Math.max(14, Math.floor(height * 0.025));
        ctx.font = `bold ${speakerFontSize}px sans-serif`;
        ctx.fillText(`${turn.characterName}:`, safeMarginX, turnY);
        ctx.restore();
      }

      const textOffsetX = turn.characterName 
        ? safeMarginX + Math.max(70, width * 0.08) 
        : safeMarginX;

      // 4. Dòng 1: Chinese Text Layer (Font CJK nét lớn, đẹp mắt)
      const chineseFontSize = Math.max(28, Math.floor(height * 0.052));
      ctx.save();
      ctx.font = `bold ${chineseFontSize}px "PingFang SC", "Microsoft YaHei", "Noto Serif SC", sans-serif`;
      
      let cursorX = textOffsetX;
      turn.tokens.forEach((tok) => {
        const isHighlight = tok.isHighlight;
        const normalizedSegment = activeSegment?.text?.replace(/[，。！？、；：,.!?;:\s]/g, '') || '';
        const normalizedToken = tok.text.replace(/[，。！？、；：,.!?;:\s]/g, '');
        const isSpokenNow = activeSegment?.type === 'chinese_dialogue' && Boolean(normalizedToken) && (normalizedSegment === normalizedToken || normalizedSegment.includes(normalizedToken) || normalizedToken.includes(normalizedSegment));

        const tokenW = ctx.measureText(tok.text).width;

        // 6. Highlight Layer
        if (isSpokenNow) {
          ctx.save();
          ctx.fillStyle = isDark ? 'rgba(225, 29, 72, 0.4)' : 'rgba(253, 224, 71, 0.6)';
          drawRoundedRect(ctx, cursorX - 4, turnY - chineseFontSize + 4, tokenW + 8, chineseFontSize + 8, 4);
          ctx.fill();
          ctx.restore();
        } else if (isHighlight) {
          ctx.save();
          ctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(254, 240, 138, 0.4)';
          drawRoundedRect(ctx, cursorX - 2, turnY - chineseFontSize + 6, tokenW + 4, chineseFontSize + 4, 3);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = isSpokenNow 
          ? (isDark ? '#FFE4E6' : '#9F1239')
          : isHighlight
            ? (isDark ? '#FCD34D' : '#B45309')
            : (isDark ? '#FFFFFF' : '#0F172A');

        ctx.fillText(tok.text, cursorX, turnY);
        cursorX += tokenW + 2;
      });
      ctx.restore();

      // 3. Dòng 2: Pinyin Layer (Có dấu thanh điệu chuẩn)
      if (turn.pinyin) {
        ctx.save();
        const pinyinFontSize = Math.max(16, Math.floor(height * 0.028));
        ctx.font = `500 ${pinyinFontSize}px monospace, sans-serif`;
        ctx.fillStyle = isDark ? '#FB7185' : '#E11D48';
        ctx.fillText(turn.pinyin, textOffsetX, turnY + chineseFontSize * 0.65);
        ctx.restore();
      }

      // 4. Dòng 3: Vietnamese Layer (Nghĩa tiếng Việt tự nhiên)
      if (turn.vietnamese) {
        ctx.save();
        const vnFontSize = Math.max(14, Math.floor(height * 0.024));
        ctx.font = `normal italic ${vnFontSize}px sans-serif`;
        ctx.fillStyle = isDark ? '#CBD5E1' : '#475569';
        ctx.fillText(turn.vietnamese, textOffsetX, turnY + chineseFontSize * 1.25);
        ctx.restore();
      }
    });

  } else {
    // Intro hoặc Hero Slide đơn lẻ
    ctx.save();
    ctx.textAlign = 'center';
    const heroFontSize = Math.max(36, Math.floor(height * 0.075));
    ctx.font = `bold ${heroFontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
    ctx.fillText(scene.chineseText || '欢迎学习中文', width / 2, contentYStart + contentHeight * 0.35);

    if (scene.pinyin) {
      ctx.font = `600 ${Math.floor(heroFontSize * 0.45)}px monospace`;
      ctx.fillStyle = '#E11D48';
      ctx.fillText(scene.pinyin, width / 2, contentYStart + contentHeight * 0.35 + heroFontSize * 0.65);
    }

    if (scene.vietnamese) {
      ctx.font = `italic ${Math.floor(heroFontSize * 0.38)}px sans-serif`;
      ctx.fillStyle = isDark ? '#CBD5E1' : '#475569';
      ctx.fillText(scene.vietnamese, width / 2, contentYStart + contentHeight * 0.35 + heroFontSize * 1.25);
    }
    ctx.restore();
  }

  // ==========================================
  // LAYER 8: OPTIONAL TEACHER EXPLANATION BOX
  // ==========================================
  if (scene.teacherExplanation && scene.teacherExplanation.trim().length > 0) {
    const boxH = Math.max(50, Math.floor(height * 0.14));
    const boxY = safeMarginY + safeH - boxH;

    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 253, 245, 0.92)';
    ctx.strokeStyle = isDark ? '#334155' : '#F2E8C9';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, safeMarginX, boxY, safeW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    // Icon & Teacher label
    ctx.fillStyle = isDark ? '#F59E0B' : '#B45309';
    const tagFontSize = Math.max(11, Math.floor(height * 0.018));
    ctx.font = `bold ${tagFontSize}px sans-serif`;
    ctx.fillText('GIẢNG VIÊN HƯỚNG DẪN:', safeMarginX + 16, boxY + tagFontSize * 1.4);

    // Text content (tự động cắt/wrap)
    ctx.fillStyle = isDark ? '#E2E8F0' : '#451A03';
    const textFontSize = Math.max(12, Math.floor(height * 0.021));
    ctx.font = `normal ${textFontSize}px sans-serif`;
    
    // Đoạn text thu gọn nếu dài
    const maxChars = width > 1200 ? 160 : 90;
    const truncatedText = scene.teacherExplanation.length > maxChars 
      ? scene.teacherExplanation.substring(0, maxChars) + '...'
      : scene.teacherExplanation;

    ctx.fillText(`"${truncatedText}"`, safeMarginX + 16, boxY + tagFontSize * 2.8);
    ctx.restore();
  }

  // ==========================================
  // LAYER 9: SOUND EFFECT VISUAL RIPPLE (Optional)
  // Khi bắt đầu một từ mới được phát âm
  // ==========================================
  if (config.enableChimeSoundEffect && activeSegment && (currentTimeInScene - activeSegment.start < 0.4)) {
    ctx.save();
    const rippleRadius = Math.sin((currentTimeInScene - activeSegment.start) * Math.PI * 2.5) * 16;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(safeMarginX + 32, headerY, Math.max(0, 12 + rippleRadius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ==========================================
  // LAYER 10: TRANSITION LAYER
  // ==========================================
  if (transitionProgress > 0 && transitionProgress <= 1) {
    ctx.save();
    if (transitionType === 'dip_to_black') {
      const alpha = Math.sin(transitionProgress * Math.PI);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, width, height);
    } else if (transitionType === 'slide_left') {
      const offset = (1 - transitionProgress) * width;
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(width - offset, 0, offset, height);
    } else {
      // Crossfade alpha
      ctx.fillStyle = `rgba(0, 0, 0, ${(1 - transitionProgress) * 0.7})`;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }
}

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetW: number, targetH: number) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) return;

  const targetRatio = targetW / targetH;
  const imgRatio = imgW / imgH;

  let sW = imgW;
  let sH = imgH;
  let sX = 0;
  let sY = 0;

  if (imgRatio > targetRatio) {
    sW = imgH * targetRatio;
    sX = (imgW - sW) / 2;
  } else {
    sH = imgW / targetRatio;
    sY = (imgH - sH) / 2;
  }

  ctx.drawImage(img, sX, sY, sW, sH, 0, 0, targetW, targetH);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
