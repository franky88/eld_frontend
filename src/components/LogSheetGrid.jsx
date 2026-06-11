import { useEffect, useRef } from "react";
import { drawLogSheet, CANVAS_W, CANVAS_H } from "../utils/drawLogSheet";

export default function LogSheetGrid({ dayPlan }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !dayPlan) return;
    const ctx = canvasRef.current.getContext("2d");
    drawLogSheet(ctx, dayPlan);
  }, [dayPlan]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="w-full border border-gray-300 rounded shadow-sm bg-amber-50"
    />
  );
}
