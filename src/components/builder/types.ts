export interface BuilderObject {
  id: string;
  type: "image" | "text" | "shape";
  x: number; // cm from board left
  y: number; // cm from board top
  width: number; // cm
  height: number; // cm
  rotation: number; // degrees
  // Image
  src?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  // Text
  text?: string;
  fontSize?: number; // cm
  // Common
  fill?: string;
  // Logo group tracking
  logoGroupId?: string; // links duplicates from same logo upload
}

/** A logo entry for the placement dialog */
export interface LogoEntry {
  id: string;
  src: string;           // dataURL of the image
  naturalWidth: number;
  naturalHeight: number;
  fileName: string;
  widthCm: number;       // desired print width in cm
  heightCm: number;      // desired print height in cm (auto from aspect)
  quantity: number;       // how many copies
}

export type Tool = "select" | "text" | "image" | "shape";

export interface CanvasHandle {
  exportImage: () => string | null;
}

/** Compute axis-aligned bounding box of a rotated rectangle (all in cm). */
export function getObjectBounds(obj: BuilderObject) {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const rad = (obj.rotation * Math.PI) / 180;
  const hw = obj.width / 2;
  const hh = obj.height / 2;
  const corners: [number, number][] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [dx, dy] of corners) {
    const rx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    minX = Math.min(minX, rx);
    maxX = Math.max(maxX, rx);
    minY = Math.min(minY, ry);
    maxY = Math.max(maxY, ry);
  }
  return { minX, maxX, minY, maxY };
}

/** DPI of an image at current print size. */
export function getDPI(obj: BuilderObject): number {
  if (!obj.naturalWidth || !obj.naturalHeight || !obj.width || !obj.height) return 0;
  const dpiX = (obj.naturalWidth * 2.54) / obj.width;
  const dpiY = (obj.naturalHeight * 2.54) / obj.height;
  return Math.round(Math.min(dpiX, dpiY));
}

/* ═══════════════════════════════════════════════════════════════ */
/*  AUTO-LAYOUT: intelligent bin-packing for logos on a board     */
/* ═══════════════════════════════════════════════════════════════ */

const LOGO_GAP = 0.5; // cm gap between logos

/**
 * Pack logos onto a board of fixed width.
 * Uses a shelf/row-based algorithm.
 * Returns an array of BuilderObject to place on the board + required board height.
 */
export function autoLayoutLogos(
  logos: LogoEntry[],
  boardWidth: number,
  existingObjects: BuilderObject[]
): { objects: BuilderObject[]; newBoardHeight: number } {
  // Find current max Y from existing objects
  let startY = 0;
  for (const obj of existingObjects) {
    startY = Math.max(startY, getObjectBounds(obj).maxY);
  }
  if (existingObjects.length > 0) startY += LOGO_GAP * 2;

  // Build list of items to place: each logo × quantity
  const items: { logo: LogoEntry; index: number }[] = [];
  for (const logo of logos) {
    for (let i = 0; i < logo.quantity; i++) {
      items.push({ logo, index: i });
    }
  }

  // Sort items by height descending for better shelf packing
  items.sort((a, b) => b.logo.heightCm - a.logo.heightCm);

  // Shelf-based packing
  const placed: BuilderObject[] = [];
  let curX = LOGO_GAP;
  let curY = startY + LOGO_GAP;
  let rowHeight = 0;

  for (const item of items) {
    const w = item.logo.widthCm;
    const h = item.logo.heightCm;

    // If this item won't fit in the current row, move to next row
    if (curX + w + LOGO_GAP > boardWidth) {
      curX = LOGO_GAP;
      curY += rowHeight + LOGO_GAP;
      rowHeight = 0;
    }

    placed.push({
      id: `img-${item.logo.id}-${item.index}-${Date.now()}`,
      type: "image",
      x: curX,
      y: curY,
      width: w,
      height: h,
      rotation: 0,
      src: item.logo.src,
      naturalWidth: item.logo.naturalWidth,
      naturalHeight: item.logo.naturalHeight,
      logoGroupId: item.logo.id,
    });

    curX += w + LOGO_GAP;
    rowHeight = Math.max(rowHeight, h);
  }

  const maxY = curY + rowHeight + LOGO_GAP;
  const newBoardHeight = Math.max(100, Math.ceil(maxY / 25) * 25 + 25);

  return { objects: placed, newBoardHeight };
}
