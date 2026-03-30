import { useEffect, useRef, useState } from "react";
import type { LutData } from "@/types";

interface LutPreviewProps {
  imageSrc: string;
  lutData: LutData | null;
  className?: string;
}

function applyLutToPixel(
  r: number,
  g: number,
  b: number,
  data: number[],
  size: number,
): [number, number, number] {
  const scale = size - 1;
  const rIdx = r * scale;
  const gIdx = g * scale;
  const bIdx = b * scale;

  const r0 = Math.floor(rIdx),
    r1 = Math.min(r0 + 1, scale);
  const g0 = Math.floor(gIdx),
    g1 = Math.min(g0 + 1, scale);
  const b0 = Math.floor(bIdx),
    b1 = Math.min(b0 + 1, scale);

  const rf = rIdx - r0;
  const gf = gIdx - g0;
  const bf = bIdx - b0;

  function sample(ri: number, gi: number, bi: number) {
    const idx = (bi * size * size + gi * size + ri) * 3;
    return [data[idx], data[idx + 1], data[idx + 2]];
  }

  const c000 = sample(r0, g0, b0);
  const c100 = sample(r1, g0, b0);
  const c010 = sample(r0, g1, b0);
  const c110 = sample(r1, g1, b0);
  const c001 = sample(r0, g0, b1);
  const c101 = sample(r1, g0, b1);
  const c011 = sample(r0, g1, b1);
  const c111 = sample(r1, g1, b1);

  const result: [number, number, number] = [0, 0, 0];
  for (let ch = 0; ch < 3; ch++) {
    const c00 = c000[ch] * (1 - rf) + c100[ch] * rf;
    const c01 = c001[ch] * (1 - rf) + c101[ch] * rf;
    const c10 = c010[ch] * (1 - rf) + c110[ch] * rf;
    const c11 = c011[ch] * (1 - rf) + c111[ch] * rf;
    const c0 = c00 * (1 - gf) + c10 * gf;
    const c1 = c01 * (1 - gf) + c11 * gf;
    result[ch] = c0 * (1 - bf) + c1 * bf;
  }

  return result;
}

export function LutPreview({ imageSrc, lutData, className }: LutPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setDimensions({ width: img.width, height: img.height });

      ctx.drawImage(img, 0, 0);

      if (lutData && lutData.data.length > 0) {
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i] / 255;
          const g = pixels[i + 1] / 255;
          const b = pixels[i + 2] / 255;

          const [nr, ng, nb] = applyLutToPixel(r, g, b, lutData.data, lutData.size);

          pixels[i] = Math.round(Math.min(1, Math.max(0, nr)) * 255);
          pixels[i + 1] = Math.round(Math.min(1, Math.max(0, ng)) * 255);
          pixels[i + 2] = Math.round(Math.min(1, Math.max(0, nb)) * 255);
        }

        ctx.putImageData(imageData, 0, 0);
      }
    };
    img.src = imageSrc;
  }, [imageSrc, lutData]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: dimensions.width ? "block" : "none",
      }}
    />
  );
}
