import { useEffect, useState } from 'react';

const trimmed = new Map<string, string>();

function isPadding(r: number, g: number, b: number, a: number) {
  if (a < 12) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max > 242 && max - min < 18;
}

/** Recorta margem clara/transparente para a marca ocupar o quadro sem esticar. */
function trimLogoPadding(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (w < 8 || h < 8) {
          resolve(null);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        const step = w * h > 800_000 ? 2 : 1;
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            const i = (y * w + x) * 4;
            if (!isPadding(data[i], data[i + 1], data[i + 2], data[i + 3])) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX <= minX || maxY <= minY) {
          resolve(null);
          return;
        }
        const contentW = maxX - minX + step;
        const contentH = maxY - minY + step;
        if (contentW / w > 0.86 && contentH / h > 0.86) {
          resolve(null);
          return;
        }
        const pad = Math.round(Math.max(contentW, contentH) * 0.08);
        const sx = Math.max(0, minX - pad);
        const sy = Math.max(0, minY - pad);
        const sw = Math.min(w - sx, contentW + pad * 2);
        const sh = Math.min(h - sy, contentH + pad * 2);
        const out = document.createElement('canvas');
        const maxSide = 320;
        const scale = Math.min(1, maxSide / Math.max(sw, sh));
        out.width = Math.max(1, Math.round(sw * scale));
        out.height = Math.max(1, Math.round(sh * scale));
        const octx = out.getContext('2d');
        if (!octx) {
          resolve(null);
          return;
        }
        octx.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
        out.toBlob((blob) => {
          resolve(blob ? URL.createObjectURL(blob) : null);
        }, 'image/png');
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const FRAME = {
  card: 'h-24 w-24',
} as const;

/**
 * Quadro da marca. No card da listagem fica quadrado e fixo.
 * Na página do financiador ocupa a faixa da coluna direita, como a logo da organização na solução.
 */
export function FunderLogo({
  src,
  size = 'card',
  className = '',
}: {
  src: string;
  size?: 'card' | 'banner';
  className?: string;
}) {
  const [display, setDisplay] = useState(src);

  useEffect(() => {
    const cached = trimmed.get(src);
    if (cached) {
      setDisplay(cached);
      return;
    }
    let cancelled = false;
    void trimLogoPadding(src).then((url) => {
      if (cancelled || !url) return;
      trimmed.set(src, url);
      setDisplay(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (size === 'banner') {
    return (
      <div
        className={`overflow-hidden rounded-[16px] border border-cac-line bg-white shadow-[0_10px_28px_rgba(10,36,64,.06)] ${className}`}
      >
        <div className="flex h-[8.5rem] items-center justify-center bg-white px-6 py-4">
          <img src={display} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-cac-line bg-white ${FRAME[size]} ${className}`}
    >
      <img src={display} alt="" className="h-full w-full object-contain p-2" />
    </span>
  );
}
