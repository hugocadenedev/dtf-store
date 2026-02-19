"use client";

import {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text as KText,
  Image as KImage,
  Group,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import type { BuilderObject, Tool, CanvasHandle } from "./types";

const PADDING = 30;
const RULER_SIZE = 36;

/* ═══════════════════ Hook: load image from data URL ═══════════════════ */
function useLoadedImage(src?: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    image.onload = () => setImg(image);
    return () => {
      image.onload = null;
    };
  }, [src]);
  return img;
}

/* ═══════════════════ Sub-component: image on canvas ═══════════════════ */
function KonvaImageNode({
  obj,
  pxPerCm,
  onSelect,
  onChange,
}: {
  obj: BuilderObject;
  pxPerCm: number;
  onSelect: () => void;
  onChange: (u: Partial<BuilderObject>) => void;
}) {
  const shapeRef = useRef<Konva.Image>(null);
  const img = useLoadedImage(obj.src);
  if (!img) return null;
  return (
    <KImage
      ref={shapeRef}
      id={obj.id}
      image={img}
      x={obj.x * pxPerCm}
      y={obj.y * pxPerCm}
      width={obj.width * pxPerCm}
      height={obj.height * pxPerCm}
      rotation={obj.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) =>
        onChange({ x: e.target.x() / pxPerCm, y: e.target.y() / pxPerCm })
      }
      onTransformEnd={() => {
        const n = shapeRef.current;
        if (!n) return;
        const sx = n.scaleX(),
          sy = n.scaleY();
        n.scaleX(1);
        n.scaleY(1);
        onChange({
          x: n.x() / pxPerCm,
          y: n.y() / pxPerCm,
          width: Math.max(0.5, (n.width() * sx) / pxPerCm),
          height: Math.max(0.5, (n.height() * sy) / pxPerCm),
          rotation: n.rotation(),
        });
      }}
    />
  );
}

/* ═══════════════════ Main Canvas ═══════════════════ */
interface Props {
  boardWidth: number;
  boardHeight: number;
  objects: BuilderObject[];
  selectedId: string | null;
  zoom: number;
  activeTool: Tool;
  fillColor: string;
  onSelect: (id: string | null) => void;
  onUpdateObject: (id: string, u: Partial<BuilderObject>) => void;
  onAddObject: (obj: BuilderObject) => void;
}

const BuilderCanvas = forwardRef<CanvasHandle, Props>(function BuilderCanvas(
  {
    boardWidth,
    boardHeight,
    objects,
    selectedId,
    zoom,
    activeTool,
    fillColor,
    onSelect,
    onUpdateObject,
    onAddObject,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  // Keep board pixel geometry in a ref for export
  const geomRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  /* expose export — hides grid, rulers, transformer, shadow for clean output */
  useImperativeHandle(ref, () => ({
    exportImage: () => {
      if (!stageRef.current || !layerRef.current) return null;
      const layer = layerRef.current;
      const { x, y, w, h } = geomRef.current;

      // Collect nodes to hide during export
      const hidden: Konva.Node[] = [];
      // Hide grid lines
      layer.find('.grid').forEach((n: Konva.Node) => { hidden.push(n); n.visible(false); });
      // Hide rulers
      layer.find('Text').forEach((n: Konva.Node) => {
        // Ruler texts are outside the board group (no id, positioned at ruler area)
        if (!n.id() && (n.y() < y || n.x() < x)) { hidden.push(n); n.visible(false); }
      });
      // Hide transformer
      if (trRef.current) { hidden.push(trRef.current); trRef.current.visible(false); }
      // Hide board shadow temporarily
      const boardNode = layer.findOne('.board') as Konva.Rect | undefined;
      let origShadow = 0;
      if (boardNode) { origShadow = boardNode.shadowBlur(); boardNode.shadowBlur(0); }

      layer.batchDraw();

      // Compute pixelRatio for true 300 DPI output
      // 60 cm board → 7087 px wide, 100 cm → 11811 px tall (~83 Mpx, within browser limit of ~268 Mpx)
      const targetWidthPx = (boardWidth / 2.54) * 300;
      const idealRatio = Math.ceil(targetWidthPx / w);

      // Browser canvas hard limit ~16384 px per axis or ~268 Mpx total
      const MAX_DIM = 16384;
      const MAX_PIXELS = 268_000_000;
      const outW = w * idealRatio;
      const outH = h * idealRatio;
      let ratio = idealRatio;
      if (outW > MAX_DIM || outH > MAX_DIM || outW * outH > MAX_PIXELS) {
        // Scale down to fit within browser limits while maximising DPI
        const byWidth = MAX_DIM / w;
        const byHeight = MAX_DIM / h;
        const byPixels = Math.sqrt(MAX_PIXELS / (w * h));
        ratio = Math.floor(Math.min(byWidth, byHeight, byPixels));
      }
      ratio = Math.max(3, ratio); // never go below 3×

      const actualDPI = Math.round((ratio * w) / (boardWidth / 2.54));
      console.log(`[Canvas export] board ${boardWidth}×${boardHeight}cm | ratio ${ratio}× | output ${w * ratio}×${h * ratio}px | ${actualDPI} DPI`);

      let result = stageRef.current.toDataURL({ x, y, width: w, height: h, pixelRatio: ratio, mimeType: 'image/png' });

      // Validate export (browsers return "data:," for oversized canvases)
      if (!result || result.length < 100 || result === 'data:,') {
        // Retry at lower ratio
        const fallback = Math.max(3, Math.floor(ratio * 0.6));
        console.warn(`[Canvas export] Failed at ratio ${ratio}×, retrying at ${fallback}×`);
        result = stageRef.current.toDataURL({ x, y, width: w, height: h, pixelRatio: fallback, mimeType: 'image/png' });
        if (!result || result.length < 100 || result === 'data:,') {
          console.error('Canvas export failed even at reduced ratio');
          hidden.forEach((n) => n.visible(true));
          if (boardNode) boardNode.shadowBlur(origShadow);
          layer.batchDraw();
          return null;
        }
      }

      // Restore visibility
      hidden.forEach((n) => n.visible(true));
      if (boardNode) boardNode.shadowBlur(origShadow);
      layer.batchDraw();

      return result;
    },
  }));

  /* container resize */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => {
      const { width, height } = e[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* px/cm scale */
  const pxPerCm = useMemo(() => {
    const availW = size.width - PADDING * 2 - RULER_SIZE;
    const availH = size.height - PADDING * 2 - RULER_SIZE;
    return Math.min(availW / boardWidth, availH / boardHeight) * (zoom / 100);
  }, [size, boardWidth, boardHeight, zoom]);

  const boardPxW = boardWidth * pxPerCm;
  const boardPxH = boardHeight * pxPerCm;
  const boardX = RULER_SIZE + (size.width - RULER_SIZE - boardPxW) / 2;
  const boardY = RULER_SIZE + (size.height - RULER_SIZE - boardPxH) / 2;
  geomRef.current = { x: boardX, y: boardY, w: boardPxW, h: boardPxH };

  /* transformer */
  useEffect(() => {
    const tr = trRef.current;
    const layer = layerRef.current;
    if (!tr || !layer) return;
    if (selectedId) {
      const node = layer.findOne(`#${selectedId}`);
      if (node) {
        tr.nodes([node]);
      } else {
        tr.nodes([]);
      }
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedId, objects]);

  /* click handler */
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const target = e.target;
      const onEmpty =
        target === stageRef.current ||
        target.name() === "bg" ||
        target.name() === "board" ||
        target.name() === "grid";

      if (!onEmpty) {
        // clicked on an object
        const id = target.id();
        if (id) onSelect(id);
        return;
      }

      if (activeTool === "select") {
        onSelect(null);
        return;
      }

      // Add object
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const rx = (pos.x - boardX) / pxPerCm;
      const ry = (pos.y - boardY) / pxPerCm;
      if (rx < 0 || rx > boardWidth || ry < 0 || ry > boardHeight) {
        onSelect(null);
        return;
      }

      if (activeTool === "text") {
        onAddObject({
          id: `text-${Date.now()}`,
          type: "text",
          x: Math.max(0, rx - 5),
          y: Math.max(0, ry - 1),
          width: 10,
          height: 3,
          rotation: 0,
          text: "Texte",
          fontSize: 1.2,
          fill: fillColor,
        });
      } else if (activeTool === "shape") {
        onAddObject({
          id: `shape-${Date.now()}`,
          type: "shape",
          x: Math.max(0, rx - 2.5),
          y: Math.max(0, ry - 2.5),
          width: 5,
          height: 5,
          rotation: 0,
          fill: fillColor,
        });
      }
    },
    [activeTool, boardX, boardY, pxPerCm, boardWidth, boardHeight, fillColor, onSelect, onAddObject]
  );

  /* grid lines */
  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (let x = 0; x <= boardWidth; x++) {
      const major = x % 5 === 0;
      lines.push(
        <Line
          key={`v${x}`}
          points={[x * pxPerCm, 0, x * pxPerCm, boardPxH]}
          stroke={major ? "rgba(180,190,210,0.55)" : "rgba(200,210,230,0.25)"}
          strokeWidth={major ? 0.8 : 0.4}
          listening={false}
          name="grid"
        />
      );
    }
    for (let y = 0; y <= boardHeight; y++) {
      const major = y % 5 === 0;
      lines.push(
        <Line
          key={`h${y}`}
          points={[0, y * pxPerCm, boardPxW, y * pxPerCm]}
          stroke={major ? "rgba(180,190,210,0.55)" : "rgba(200,210,230,0.25)"}
          strokeWidth={major ? 0.8 : 0.4}
          listening={false}
          name="grid"
        />
      );
    }
    return lines;
  }, [boardWidth, boardHeight, pxPerCm, boardPxH, boardPxW]);

  /* ruler labels */
  const rulers = useMemo(() => {
    const els: React.ReactNode[] = [];
    for (let x = 0; x <= boardWidth; x += 25) {
      els.push(
        <KText
          key={`rx${x}`}
          text={`${x}cm`}
          x={boardX + x * pxPerCm - 10}
          y={boardY - 16}
          fontSize={9}
          fill="#94a3b8"
          listening={false}
        />
      );
    }
    for (let y = 0; y <= boardHeight; y += 25) {
      els.push(
        <KText
          key={`ry${y}`}
          text={`${y}cm`}
          x={boardX - 34}
          y={boardY + y * pxPerCm - 5}
          fontSize={9}
          fill="#94a3b8"
          listening={false}
        />
      );
    }
    return els;
  }, [boardWidth, boardHeight, pxPerCm, boardX, boardY]);

  /* helper to make common onDragEnd / onTransformEnd */
  const makeDragEnd =
    (id: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
      onUpdateObject(id, {
        x: e.target.x() / pxPerCm,
        y: e.target.y() / pxPerCm,
      });
    };

  const makeTransformEnd =
    (id: string, obj: BuilderObject) => (e: Konva.KonvaEventObject<Event>) => {
      const n = e.target;
      const sx = n.scaleX(),
        sy = n.scaleY();
      n.scaleX(1);
      n.scaleY(1);
      if (obj.type === "text") {
        onUpdateObject(id, {
          x: n.x() / pxPerCm,
          y: n.y() / pxPerCm,
          fontSize: (obj.fontSize || 1) * sx,
          width: (n.width() * sx) / pxPerCm,
          rotation: n.rotation(),
        });
      } else {
        onUpdateObject(id, {
          x: n.x() / pxPerCm,
          y: n.y() / pxPerCm,
          width: Math.max(0.5, (n.width() * sx) / pxPerCm),
          height: Math.max(0.5, (n.height() * sy) / pxPerCm),
          rotation: n.rotation(),
        });
      }
    };

  const cursor =
    activeTool === "select"
      ? "default"
      : activeTool === "text"
      ? "text"
      : "crosshair";

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#2d3748", cursor }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Background */}
        <Layer>
          <Rect
            width={size.width}
            height={size.height}
            fill="#2d3748"
            name="bg"
          />
        </Layer>

        {/* Main layer */}
        <Layer ref={layerRef}>
          {/* Board */}
          <Group x={boardX} y={boardY}>
            <Rect
              width={boardPxW}
              height={boardPxH}
              fill="#ffffff"
              shadowBlur={15}
              shadowColor="rgba(0,0,0,0.25)"
              shadowOffsetY={4}
              name="board"
              cornerRadius={2}
            />
            {gridLines}
          </Group>

          {/* Objects */}
          <Group x={boardX} y={boardY}>
            {objects.map((obj) => {
              if (obj.type === "image") {
                return (
                  <KonvaImageNode
                    key={obj.id}
                    obj={obj}
                    pxPerCm={pxPerCm}
                    onSelect={() => onSelect(obj.id)}
                    onChange={(u) => onUpdateObject(obj.id, u)}
                  />
                );
              }
              if (obj.type === "text") {
                return (
                  <KText
                    key={obj.id}
                    id={obj.id}
                    text={obj.text || "Texte"}
                    x={obj.x * pxPerCm}
                    y={obj.y * pxPerCm}
                    width={obj.width * pxPerCm}
                    fontSize={(obj.fontSize || 1) * pxPerCm}
                    fill={obj.fill || "#000000"}
                    rotation={obj.rotation}
                    draggable
                    onClick={() => onSelect(obj.id)}
                    onTap={() => onSelect(obj.id)}
                    onDragEnd={makeDragEnd(obj.id)}
                    onTransformEnd={makeTransformEnd(obj.id, obj)}
                  />
                );
              }
              if (obj.type === "shape") {
                return (
                  <Rect
                    key={obj.id}
                    id={obj.id}
                    x={obj.x * pxPerCm}
                    y={obj.y * pxPerCm}
                    width={obj.width * pxPerCm}
                    height={obj.height * pxPerCm}
                    fill={obj.fill || "#000000"}
                    rotation={obj.rotation}
                    draggable
                    onClick={() => onSelect(obj.id)}
                    onTap={() => onSelect(obj.id)}
                    onDragEnd={makeDragEnd(obj.id)}
                    onTransformEnd={makeTransformEnd(obj.id, obj)}
                  />
                );
              }
              return null;
            })}

            {/* Transformer */}
            <Transformer
              ref={trRef}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              borderStroke="#3b82f6"
              anchorStroke="#3b82f6"
              anchorFill="#ffffff"
              anchorSize={8}
              anchorCornerRadius={2}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5)
                  return oldBox;
                return newBox;
              }}
            />
          </Group>

          {/* Rulers */}
          {rulers}
        </Layer>
      </Stage>
    </div>
  );
});

export default BuilderCanvas;
