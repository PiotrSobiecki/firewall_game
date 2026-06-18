import Phaser from "phaser";

/** Gałązki w układzie -12..12 (środek 0,0 = środek kłębu). */
const BRANCHES: [number, number, number, number][] = [
  [-1, -9, 2, -3],
  [3, -7, 8, -2],
  [7, -1, 10, 4],
  [5, 5, 9, 9],
  [-2, 6, 3, 10],
  [-8, 3, -4, 8],
  [-9, -3, -5, 2],
  [-6, -7, -1, -4],
  [0, -10, 0, -5],
  [-3, 0, 4, 1],
  [2, 2, 7, 6],
  [-7, -1, -2, 3],
  [1, -4, 6, 0],
  [-4, -5, 0, -1],
  [4, -5, 8, -1],
  [-1, 4, 2, 8],
];

/** Luźne piksele wypełnienia — splątany rdzeń. */
const CORE: [number, number][] = [
  [0, -2], [1, -3], [-1, -3], [2, -1], [-2, -1], [0, 0], [1, 1], [-1, 1],
  [2, 2], [-2, 2], [3, 0], [-3, 0], [0, 3], [1, -1], [-1, 0], [2, -4],
  [-2, -4], [0, -5], [-3, 3], [3, 3], [-4, 0], [4, -2],
];

/** Wispy pasmo wiatru — zawsze leci w lewo (za kłębem). */
const WISPS: [number, number, number, number][] = [
  [-5, -8, -14, -10],
  [-3, -5, -12, -6],
  [-7, -2, -15, -1],
  [-4, 2, -11, 4],
  [-6, 5, -13, 7],
  [-2, -9, -10, -12],
];

export type TumblePalette = {
  base: number;
  hi: number;
  dark: number;
  strand: number;
};

function rot(x: number, y: number, roll: number): { x: number; y: number } {
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  return { x: x * c - y * s, y: x * s + y * c };
}

/** Pixelowy kłęb jak na pustyni Arizona — splątane gałązki + wispy pasmo. */
export function drawPixelTumbleweed(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  groundY: number,
  scale: number,
  rollRad: number,
  palette: TumblePalette,
  alpha: number,
): void {
  const r = 14 * scale;
  const cy = groundY - r;
  const u = Math.max(2, Math.round(2.2 * scale));
  const snap = (v: number) => Math.round(v / u) * u;

  const toWorld = (lx: number, ly: number) => {
    const p = rot(lx, ly, rollRad);
    return { x: snap(cx + p.x * scale * 0.82), y: snap(cy + p.y * scale * 0.82) };
  };

  g.fillStyle(palette.base, alpha * 0.78);
  g.fillCircle(cx, cy, r * 0.72);

  for (const [px, py] of CORE) {
    const p = toWorld(px, py);
    g.fillStyle((px + py) % 3 === 0 ? palette.hi : palette.base, alpha * 0.92);
    g.fillRect(p.x - u / 2, p.y - u / 2, u, u);
  }

  g.lineStyle(Math.max(1, u * 0.55), palette.dark, alpha * 0.9);
  for (const [x1, y1, x2, y2] of BRANCHES) {
    const a = toWorld(x1, y1);
    const b = toWorld(x2, y2);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  g.lineStyle(Math.max(1, u * 0.4), palette.strand, alpha * 0.75);
  for (const [x1, y1, x2, y2] of WISPS) {
    const a = toWorld(x1, y1);
    const b = toWorld(x2, y2);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  g.fillStyle(palette.hi, alpha * 0.45);
  g.fillCircle(cx - r * 0.15, cy - r * 0.55, Math.max(2, u * 0.6));
}
