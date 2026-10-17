import * as THREE from 'three';

/**
 * Canvas-generated signage textures for the Shantigram branding overlay
 * (banners, labels, safety signs, painted forecourt text). Purely cosmetic — no
 * simulation logic touched. Returns a texture plus its pixel aspect so callers
 * can size a plane without distorting the text.
 */

const cache = new Map<string, { texture: THREE.Texture; aspect: number }>();

export interface SignOptions {
  fg?: string;
  bg?: string; // 'transparent' for no fill
  fontWeight?: number | string;
  fontFamily?: string;
  fontSize?: number;
  paddingX?: number;
  paddingY?: number;
  border?: string;
  borderWidth?: number;
  radius?: number;
  letterSpacing?: number;
  align?: 'left' | 'center' | 'right';
}

export function makeSign(text: string, opts: SignOptions = {}): { texture: THREE.Texture; aspect: number } {
  const {
    fg = '#ffffff',
    bg = 'transparent',
    fontWeight = 800,
    fontFamily = 'Inter, Helvetica Neue, sans-serif',
    fontSize = 72,
    paddingX = 40,
    paddingY = 26,
    border = '',
    borderWidth = 0,
    radius = 0,
    letterSpacing = 2,
  } = opts;

  const key = `${text}|${JSON.stringify(opts)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const measure = document.createElement('canvas').getContext('2d')!;
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  measure.font = font;
  const textW = measure.measureText(text).width + letterSpacing * text.length;

  const W = Math.ceil(textW + paddingX * 2);
  const H = Math.ceil(fontSize * 1.35 + paddingY * 2);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  if (bg !== 'transparent') {
    ctx.fillStyle = bg;
    if (radius > 0) {
      roundRect(ctx, 0, 0, W, H, radius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, W, H);
    }
  }
  if (border && borderWidth > 0) {
    ctx.strokeStyle = border;
    ctx.lineWidth = borderWidth;
    if (radius > 0) {
      roundRect(ctx, borderWidth / 2, borderWidth / 2, W - borderWidth, H - borderWidth, radius);
      ctx.stroke();
    } else {
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, W - borderWidth, H - borderWidth);
    }
  }

  ctx.font = font;
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  // manual letter spacing
  drawSpacedText(ctx, text, W / 2, H / 2, letterSpacing);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const result = { texture, aspect: W / H };
  cache.set(key, result);
  return result;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  spacing: number,
) {
  if (spacing <= 0) {
    ctx.fillText(text, cx, cy);
    return;
  }
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, cy);
    x += widths[i] + spacing;
  }
  ctx.textAlign = 'center';
}
