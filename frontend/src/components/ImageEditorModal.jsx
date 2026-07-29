import { useRef, useState, useEffect, useCallback } from "react";
import { FiRotateCcw, FiRotateCw, FiCheck, FiX, FiZoomIn } from "react-icons/fi";

export default function ImageEditorModal({
  imageSrc,
  aspect = 1,
  shape = "rect",
  outputSize = 500,
  onCancel,
  onSave,
}) {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const dragState = useRef(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);

  // Crop viewport size (CSS px), derived from aspect, capped to a sensible max
  const CROP_W = 320;
  const CROP_H = Math.round(CROP_W / aspect);

  const baseScale =
    naturalSize.w && naturalSize.h
      ? Math.max(CROP_W / naturalSize.w, CROP_H / naturalSize.h)
      : 1;

  const handleImgLoad = (e) => {
    setNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    setImgLoaded(true);
    setPos({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // ===== DRAG TO PAN =====
  const onPointerDown = (e) => {
    const point = e.touches ? e.touches[0] : e;
    dragState.current = { startX: point.clientX, startY: point.clientY, origin: pos };
  };

  const onPointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - dragState.current.startX;
    const dy = point.clientY - dragState.current.startY;
    setPos({
      x: dragState.current.origin.x + dx,
      y: dragState.current.origin.y + dy,
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const rotateBy = (deg) => setRotation((r) => r + deg);

  // ===== EXPORT =====
  const handleSave = () => {
    setSaving(true);
    const OUTPUT_W = outputSize;
    const OUTPUT_H = Math.round(OUTPUT_W / aspect);
    const scaleFactor = OUTPUT_W / CROP_W;
    const effectiveScale = zoom * baseScale * scaleFactor;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.translate(OUTPUT_W / 2, OUTPUT_H / 2);
    ctx.translate(pos.x * scaleFactor, pos.y * scaleFactor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(effectiveScale, effectiveScale);
    ctx.drawImage(imgRef.current, -naturalSize.w / 2, -naturalSize.h / 2);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onSave(blob, URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl p-5 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--color-heading)]">
            Edit photo
          </h3>
          <button
            onClick={onCancel}
            className="text-[var(--color-body)] hover:text-[var(--color-heading)] transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* CROP VIEWPORT */}
        <div
          ref={containerRef}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
          className="relative mx-auto bg-[var(--color-surface-muted)] overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
          style={{
            width: CROP_W,
            height: CROP_H,
            borderRadius: shape === "circle" ? "9999px" : "0.75rem",
          }}
        >
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[var(--color-secondary-light)] border-t-[var(--color-secondary)] rounded-full animate-spin" />
            </div>
          )}
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={handleImgLoad}
            alt="Editing"
            draggable={false}
            className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
            style={{
              width: naturalSize.w,
              height: naturalSize.h,
              transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${zoom * baseScale})`,
              opacity: imgLoaded ? 1 : 0,
            }}
          />
          {/* Grid overlay for framing guidance */}
          {imgLoaded && shape === "rect" && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <FiZoomIn size={16} className="text-[var(--color-body)] flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-secondary)]"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => rotateBy(-90)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-surface-tint)] text-[var(--color-heading)] text-sm hover:bg-[var(--color-surface-muted)] transition-colors"
            >
              <FiRotateCcw size={15} /> Rotate
            </button>
            <button
              onClick={() => rotateBy(90)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-surface-tint)] text-[var(--color-heading)] text-sm hover:bg-[var(--color-surface-muted)] transition-colors"
            >
              <FiRotateCw size={15} /> Rotate
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[var(--color-surface-muted)] text-[var(--color-heading)] font-medium hover:bg-[var(--color-surface-tint)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!imgLoaded || saving}
            className="flex-1 py-2.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-transform hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, var(--color-secondary) 0%, #5b3aa8 100%)",
            }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <FiCheck size={16} />
            )}
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}























