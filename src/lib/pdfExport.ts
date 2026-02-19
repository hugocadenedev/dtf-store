/**
 * Generates a high-quality PDF from builder objects.
 *
 * Instead of rasterizing the entire board through a canvas (which degrades logo quality),
 * this embeds each image at its ORIGINAL full resolution directly into the PDF.
 * The result is a true vector-layout PDF where every logo retains its native pixel data.
 */
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import type { BuilderObject } from "@/components/builder/types";

const CM_TO_PT = 28.3465; // 1 cm ≈ 28.3465 PDF points (1 pt = 1/72 in)

/** Convert hex color (#rrggbb) → [r, g, b] in 0–1 range */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (h.length < 6) return [0, 0, 0];
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/**
 * Build a PDF from an array of BuilderObjects.
 * Each image is embedded at its original resolution — no canvas rasterization.
 *
 * @returns PDF bytes as Uint8Array
 */
export async function generateBoardPdf(
  objects: BuilderObject[],
  boardWidthCm: number,
  boardHeightCm: number
): Promise<Uint8Array> {
  const pageW = boardWidthCm * CM_TO_PT;
  const pageH = boardHeightCm * CM_TO_PT;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageW, pageH]);

  // White board background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
    color: rgb(1, 1, 1),
  });

  // Embed a font for text objects (only if needed)
  const hasText = objects.some((o) => o.type === "text" && o.text);
  const font = hasText
    ? await pdfDoc.embedFont(StandardFonts.Helvetica)
    : null;

  // Image cache: embed each unique source only once (saves huge file size for duplicated logos)
  type PdfImg = Awaited<ReturnType<typeof pdfDoc.embedPng>>;
  const imgCache = new Map<string, PdfImg>();

  for (const obj of objects) {
    /* ─── IMAGE ─── */
    if (obj.type === "image" && obj.src) {
      let pdfImg = imgCache.get(obj.src);

      if (!pdfImg) {
        try {
          const res = await fetch(obj.src);
          const bytes = new Uint8Array(await res.arrayBuffer());

          // Detect format from data-URL header
          const isPng =
            obj.src.startsWith("data:image/png") ||
            (bytes[0] === 0x89 && bytes[1] === 0x50); // PNG magic bytes

          pdfImg = isPng
            ? await pdfDoc.embedPng(bytes)
            : await pdfDoc.embedJpg(bytes);
        } catch (e) {
          console.warn(`[pdfExport] Failed to embed image ${obj.id}:`, e);
          continue; // skip this image rather than crash the whole export
        }
        imgCache.set(obj.src, pdfImg);
      }

      const w = obj.width * CM_TO_PT;
      const h = obj.height * CM_TO_PT;

      // Coordinate transform: Konva has origin top-left (Y ↓), PDF has origin bottom-left (Y ↑)
      // Konva rotates around the top-left corner of the image.
      // pdf-lib rotates around the draw origin (x, y) which is the bottom-left of the image.
      // To match Konva's rotation pivot we solve for the draw origin:
      //   topLeft(PDF) = (obj.x * s, pageH - obj.y * s)
      //   drawOrigin   = topLeft + rotation applied to offset (0, -h)
      const topLeftX = obj.x * CM_TO_PT;
      const topLeftY = pageH - obj.y * CM_TO_PT;
      const alphaRad = (-obj.rotation * Math.PI) / 180;
      const drawX = topLeftX - h * Math.sin(alphaRad);
      const drawY = topLeftY - h * Math.cos(alphaRad);

      page.drawImage(pdfImg, {
        x: drawX,
        y: drawY,
        width: w,
        height: h,
        rotate: degrees(-obj.rotation),
      });

      /* ─── TEXT ─── */
    } else if (obj.type === "text" && obj.text && font) {
      const size = (obj.fontSize || 1) * CM_TO_PT;
      const x = obj.x * CM_TO_PT;
      const y = pageH - obj.y * CM_TO_PT - size;
      const [r, g, b] = hexToRgb(obj.fill || "#000000");
      page.drawText(obj.text, { x, y, size, font, color: rgb(r, g, b) });

      /* ─── SHAPE (rectangle) ─── */
    } else if (obj.type === "shape") {
      const w = obj.width * CM_TO_PT;
      const h = obj.height * CM_TO_PT;
      const x = obj.x * CM_TO_PT;
      const y = pageH - (obj.y + obj.height) * CM_TO_PT;
      const [r, g, b] = hexToRgb(obj.fill || "#000000");
      page.drawRectangle({ x, y, width: w, height: h, color: rgb(r, g, b) });
    }
  }

  return pdfDoc.save();
}
